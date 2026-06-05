import { useContext } from "react";

import { css } from "styled-system/css";
import { hstack } from "styled-system/patterns";

import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";

import { Empty } from "./components/Empty";
import { ImagesContext } from "./context/ImagesContext";

const Preview = await import("@/components/Preview").then((mod) => mod.Preview);

export const Layout = () => {
  const { images, imagesWithError } = useContext(ImagesContext);
  return (
    <>
      <Header />
      <main
        className={hstack({
          alignItems: "stretch",
          flex: 1,
          gap: "0",
          overflow: "hidden",
        })}
      >
        <div
          className={css({
            flex: 1,
            minWidth: 0,
            overflow: "auto",
          })}
        >
          {images.length === 0 && imagesWithError.length === 0 ? (
            <Empty />
          ) : (
            <Preview />
          )}
        </div>
        <Sidebar />
      </main>
    </>
  );
};
