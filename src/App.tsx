import { ImageUploader } from "./ImageUploader";
import { PrintableImages } from "./PrintableImages";
import { SettingsForm } from "./SettingsForm";
import { SettingsProvider } from "./context/SettingsProvider";
import { ImagesProvider } from "./context/ImagesProvider";

import { hstack, vstack } from "styled-system/patterns";
import { Toaster } from "./components/ui/styled/toast";
import { AlertToast } from "./components/ui/toast";
import { toaster } from "./utils/toaster";
import { Header } from "./components/Header";
import { css } from "styled-system/css";

function App() {
  return (
    <SettingsProvider>
      <ImagesProvider>
        <Toaster toaster={toaster}>
          {(toast) => <AlertToast toast={toast} />}
        </Toaster>
        <Header />
        <main
          className={hstack({
            alignItems: "stretch",
            flex: 1,
            gap: "0",
            overflow: 'hidden'
          })}
        >
          <PrintableImages />
          <aside
            className={css({
              backgroundColor: "bg.subtle",
              boxShadow: "sm",
              zIndex: "2",
              overflow: 'auto'
            })}
          >
            <div
              className={vstack({
                gap: "4",
                paddingY: "2",
                paddingX: "4",
                lg: {
                  paddingY: "4",
                  paddingX: "8",
                }
              })}
            >
              <ImageUploader />
              <SettingsForm />
            </div>
          </aside>
        </main>
        {/* <footer className={center()}>
          <Link asChild>
            <a href="https://github.com/alex-taxiera/proxy-print">
              {"<Code />"}
            </a>
          </Link>
          &nbsp;by&nbsp;
          <Link asChild>
            <a href="https://github.com/alex-taxiera">Alex Taxiera</a>
          </Link>
          &nbsp;|&nbsp;
          <Link asChild>
            <a
              href="https://discord.gg/A5AkkyP8CU"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FontAwesomeIcon icon={faDiscord} style={{ color: "inherit" }} />
            </a>
          </Link>
        </footer> */}
      </ImagesProvider>
    </SettingsProvider>
  );
}

export default App;
