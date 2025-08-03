import { ImageUploader } from "./ImageUploader";
import { PrintableImages } from "./PrintableImages";
import { SettingsForm } from "./SettingsForm";
import { SettingsProvider } from "./context/SettingsProvider";
import { ImagesProvider } from "./context/ImagesProvider";

import { CommunityBanner } from "./CommunityBanner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDiscord } from "@fortawesome/free-brands-svg-icons";
import { center, hstack, vstack } from "styled-system/patterns";
import { Toaster } from "./components/ui/styled/toast";
import { AlertToast } from "./components/ui/toast";
import { toaster } from "./utils/toaster";
import { Link } from "./components/ui/link";

function App() {
  return (
    <SettingsProvider>
      <ImagesProvider>
        <Toaster toaster={toaster}>
          {(toast) => <AlertToast toast={toast} />}
        </Toaster>
        <CommunityBanner />
        <header className={center({ fontSize: "4xl", fontWeight: "bold" })}>
          <h1>Proxy Print Setup</h1>
        </header>
        <main
          className={hstack({
            justify: "center",
            alignItems: "flex-start",
            gap: "12",
            flex: 1,
            paddingX: "12",
          })}
        >
          <PrintableImages />
          <aside className={vstack({ alignItems: "center" })}>
            <div className={vstack({ gap: "4" })}>
              <ImageUploader />
              <SettingsForm />
            </div>
          </aside>
        </main>
        <footer className={center()}>
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
        </footer>
      </ImagesProvider>
    </SettingsProvider>
  );
}

export default App;
