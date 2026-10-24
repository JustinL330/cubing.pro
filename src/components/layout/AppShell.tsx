import { Box, Container } from "@chakra-ui/react";
import type { ReactNode } from "react";

import { AppHeader } from "./AppHeader";
import { SkipToMainLink } from "./SkipToMainLink";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <Box minH="100dvh" display="flex" flexDirection="column">
      <SkipToMainLink />
      <AppHeader />
      <Box as="main" id="main-content" tabIndex={-1} flex="1" py={{ base: 4, md: 6 }} data-app-main>
        <Container maxW="container.xl" data-app-container>
          {children}
        </Container>
      </Box>
    </Box>
  );
}
