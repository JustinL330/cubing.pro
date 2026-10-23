"use client";

import "antd/dist/reset.css";

import { Alert, Button, Input, Select, Spin, Table, Typography } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";

import { WCALink, WCALinkWithCnName } from "@/components/Link/WcaLinks";
import { useI18n } from "@/contexts/I18nProvider";
import { getCountryDisplayName } from "@/views/Wca/PlayerComponents/region/all_contiry";
import {
  filterWcaSearchResults,
  getVisibleWcaSearchResults,
  getWcaSearchCountries,
  getWcaSearchResultPolicy,
} from "@/views/Wca/wcaSearchRules";
import { getWCAPersons } from "@/services/cubing-pro/wca/player";
import type { WCAPerson } from "@/services/cubing-pro/wca/types";

const { Title } = Typography;

function isValidWCAPersonArray(data: unknown): data is WCAPerson[] {
  if (!Array.isArray(data)) return false;
  return data.every(
    (item) =>
      item &&
      typeof item === "object" &&
      typeof (item as WCAPerson).wca_id === "string" &&
      typeof (item as WCAPerson).name === "string",
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 600,
  fontSize: "18px",
  padding: "12px 16px",
  borderRadius: "8px",
  border: "1px solid var(--border-default)",
  boxShadow: "0 2px 8px color-mix(in srgb, var(--foreground) 8%, transparent)",
};

export function WcaPlayersSearchView() {
  const { t, tf } = useI18n();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WCAPerson[]>([]);
  const [countryKey, setCountryKey] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    const trimmed = query.trim();

    setResults([]);
    setHasSearched(false);
    setError(null);

    if (!trimmed) {
      setLoading(false);
      return;
    }
    // The existing API client rejects inputs of 32 characters or longer.
    if (trimmed.length >= 32) {
      setLoading(false);
      setError(t("wca.players.errorMaxLength"));
      return;
    }

    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const data = await getWCAPersons(trimmed);
        if (requestId !== requestIdRef.current) return;
        if (isValidWCAPersonArray(data)) {
          setResults(data);
        } else {
          setError(t("wca.players.errorFormat"));
        }
      } catch (err: unknown) {
        if (requestId !== requestIdRef.current) return;
        setError(err instanceof Error ? err.message : t("wca.players.errorNetwork"));
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setHasSearched(true);
        }
      }
    }, 400);

    return () => {
      clearTimeout(timeout);
      requestIdRef.current += 1;
    };
  }, [query, t]);

  const countryKeys = useMemo(() => getWcaSearchCountries(results), [results]);
  const filtered = useMemo(
    () => filterWcaSearchResults(results, countryKey),
    [results, countryKey],
  );
  const policy = getWcaSearchResultPolicy(filtered.length);
  const visible = getVisibleWcaSearchResults(filtered, showAll);

  const columns = [
    {
      title: t("wca.players.wcaId"),
      dataIndex: "wca_id",
      key: "wca_id",
      width: 150,
      render: (text: string) => WCALink(text, text),
    },
    {
      title: t("wca.players.country"),
      dataIndex: "iso2",
      key: "iso2",
      width: 150,
      render: (text: string, record: WCAPerson) => (
        <>{getCountryDisplayName(text || record.country_id, record.country_id)}</>
      ),
    },
    {
      title: t("wca.players.name"),
      dataIndex: "name",
      key: "name",
      ellipsis: true,
      render: (_: string, record: WCAPerson) =>
        WCALinkWithCnName(record.wca_id, record.name),
    },
    {
      title: t("wca.players.gender"),
      dataIndex: "gender",
      key: "gender",
      width: 120,
      render: (gender: string) => {
        if (gender === "m") return t("wca.players.genderMale");
        if (gender === "f") return t("wca.players.genderFemale");
        return t("wca.players.genderOther");
      },
    },
  ];

  const isEmptyState = !query && results.length === 0 && !loading && !error;

  return (
    <div
      style={{
        padding: "24px",
        maxWidth: 1000,
        margin: "0 auto",
        display: isEmptyState ? "flex" : "block",
        flexDirection: isEmptyState ? "column" : undefined,
        justifyContent: isEmptyState ? "center" : undefined,
        alignItems: isEmptyState ? "center" : undefined,
        minHeight: isEmptyState ? "50vh" : undefined,
        boxSizing: "border-box",
      }}
    >
      <Title level={2} style={{ textAlign: "center", marginBottom: 24 }}>
        {t("wca.players.title")}
      </Title>

      <Input
        value={query}
        onChange={(event) => {
          // Invalidate in-flight requests immediately, before effect cleanup.
          requestIdRef.current += 1;
          setQuery(event.target.value);
          setCountryKey("");
          setShowAll(false);
          setResults([]);
          setHasSearched(false);
        }}
        placeholder={t("wca.players.placeholder")}
        aria-label={t("wca.players.placeholder")}
        allowClear
        size="large"
        style={inputStyle}
      />

      {error && (
        <div style={{ marginTop: 16, width: "100%", maxWidth: 600 }}>
          <Alert
            message={t("wca.players.queryTip")}
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
          />
        </div>
      )}

      {loading && (
        <div style={{ marginTop: 24 }} role="status" aria-live="polite">
          <Spin description={t("wca.players.searching")} />
        </div>
      )}

      {!loading && !error && hasSearched && results.length === 0 && (
        <Alert style={{ marginTop: 24 }} type="info" showIcon message={t("wca.players.noMatches")} />
      )}

      {!loading && results.length > 0 && (
        <div style={{ marginTop: 24, width: "100%" }}>
          <Select
            value={countryKey || undefined}
            onChange={(value: string | undefined) => {
              setCountryKey(value ?? "");
              setShowAll(false);
            }}
            allowClear
            onClear={() => {
              setCountryKey("");
              setShowAll(false);
            }}
            placeholder={t("wca.players.regionFilter")}
            aria-label={t("wca.players.regionFilter")}
            options={countryKeys.map((key) => ({
              value: key,
              label: getCountryDisplayName(key, key),
            }))}
            style={{ width: "100%", maxWidth: 400, marginBottom: 8 }}
          />
          <Typography.Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
            {t("wca.players.regionFilterHint")}
          </Typography.Text>
          {filtered.length === 0 ? (
            <Alert type="info" showIcon message={t("wca.players.noRegionMatches")} />
          ) : policy === "narrow" ? (
            <Alert
              type="warning"
              showIcon
              message={tf("wca.players.narrowResults", { count: filtered.length })}
            />
          ) : (
            <>
              {policy === "confirm" && !showAll && (
                <Alert
                  type="info"
                  showIcon
                  style={{ marginBottom: 12 }}
                  message={tf("wca.players.confirmResults", { count: filtered.length })}
                  action={
                    <Button onClick={() => setShowAll(true)}>
                      {t("wca.players.showAllResults")}
                    </Button>
                  }
                />
              )}
              <Typography.Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
                {tf("wca.players.showingResults", {
                  shown: visible.length,
                  count: filtered.length,
                })}
              </Typography.Text>
              <Table
                dataSource={visible}
                columns={columns}
                rowKey={(record) => record.wca_id}
                scroll={{ x: 680 }}
                pagination={{ pageSize: 20, showSizeChanger: false }}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
