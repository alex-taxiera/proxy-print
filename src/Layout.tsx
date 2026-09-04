import { Box, HStack } from "@chakra-ui/react";
import { useContext } from "react";

import { BottomBar } from "@/components/BottomBar";
import { Header } from "@/components/Header";
import { ZoomControls } from "@/components/Preview/ZoomControls";
import { Sidebar } from "@/components/Sidebar";

import { Empty } from "./components/Empty";
import { ImagesContext } from "./context/ImagesContext";
import { PreviewContext } from "./context/PreviewContext";

const Preview = await import("@/components/Preview").then((mod) => mod.Preview);

export const Layout = () => {
  const { images, imagesWithError } = useContext(ImagesContext);
  const { viewportRef } = useContext(PreviewContext);
  const hasPreview = images.length > 0 || imagesWithError.length > 0;

  return (
    <>
      <Header />
      <HStack
        as="main"
        alignItems="stretch"
        flex={1}
        gap={0}
        overflow="hidden"
        position="relative"
      >
        {/* Anchors the zoom controls so they stay put while the preview scrolls */}
        <Box flex={1} minWidth={0} position="relative">
          <Box ref={viewportRef} height="full" overflow="auto">
            {hasPreview ? <Preview /> : <Empty />}
          </Box>
          {hasPreview ? <ZoomControls /> : null}
        </Box>
        <Sidebar />
      </HStack>
      <BottomBar />
    </>
  );
};
