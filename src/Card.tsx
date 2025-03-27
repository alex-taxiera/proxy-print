import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import "./Card.css";
import { GoogleImageData, Image, ImagesContext } from "./context/ImagesContext";

export type CardProps = {
  image: Image;
} & React.HTMLAttributes<HTMLDivElement>;

export const Card = ({ className, image, ...restProps }: CardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const { images, onAdd, onRemove, onError, isRendering, downloadManager } =
    useContext(ImagesContext);

  const [isLoading, setIsLoading] = useState(image.id ? true : false);
  const [src, setSrc] = useState<string>("");
  const downloadedSrc = image.id
    ? downloadManager.getCachedImage(image.id)
    : undefined;

  const imageSrc = downloadedSrc ?? src;

  const isEmpty = !image.file && !image.id;

  const add = useCallback(
    (count: number) => {
      const index = images.indexOf(image);
      onAdd(
        new Array<File | GoogleImageData>(count).fill(image.file ?? image),
        index + 1
      );
    },
    [image, images, onAdd]
  );

  const buildOnAddClick = useCallback(
    (count: number) => (event: React.MouseEvent) => {
      event.stopPropagation();
      add(count);
      setMenuVisible(false);
    },
    [add]
  );

  const onRemoveClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      onRemove(image.uuid);
      setMenuVisible(false);
    },
    [image, onRemove]
  );

  const handleContextMenu = useCallback(
    (event: React.MouseEvent) => {
      if (cardRef.current && !isRendering) {
        const rect = cardRef.current.getBoundingClientRect();
        const position = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        };
        // check if position is the same as last time
        if (menuPosition.x === position.x && menuPosition.y === position.y) {
          setMenuPosition({ x: 0, y: 0 });
          return;
        }
        event.preventDefault();
        setMenuPosition(position);
        setMenuVisible(true);
      }
    },
    [isRendering, menuPosition]
  );

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      if (isEmpty || isLoading || isRendering) {
        return;
      }

      if (event.altKey) {
        onRemove(image.uuid);
      } else {
        add(1);
      }
    },
    [isEmpty, isLoading, isRendering, onRemove, image.uuid, add]
  );

  const handleClickOutside = (event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setMenuVisible(false);
    }
  };

  useEffect(() => {
    if (menuVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuVisible]);

  useEffect(() => {
    let url: string | undefined;

    if (image.file) {
      url = URL.createObjectURL(image.file);
      setSrc(url);
    } else if (image.id) {
      downloadManager
        .fetch(image.id)
        .then(() => console.debug("Image fetched"))
        .catch((error) => {
          onError(image.uuid);
          console.error("Error fetching image: ", error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }

    return () => {
      if (url) {
        setSrc("");
        URL.revokeObjectURL(url);
      }
    };
  }, [downloadManager, image, onError]);

  return (
    <div
      className={`card ${
        isEmpty ? "empty" : isLoading ? "loading" : ""
      } ${className}`}
      {...restProps}
      ref={cardRef}
      onClick={handleClick}
    >
      <div className="image-container">
        {isEmpty ? (
          <span className="empty" />
        ) : isLoading ? (
          <span className="loading" />
        ) : imageSrc ? (
          <img
            src={imageSrc}
            alt={image.file?.name ?? image.name}
            className="image"
            onContextMenu={handleContextMenu}
          />
        ) : (
          <span className="error">Error!</span>
        )}
      </div>
      <Guide position="top-left" />
      <Guide position="top-right" />
      <Guide position="bottom-left" />
      <Guide position="bottom-right" />
      {menuVisible && (
        <ul
          ref={menuRef}
          className="context-menu"
          style={{ top: menuPosition.y + 1, left: menuPosition.x + 1 }}
        >
          <li className="destructive" onClick={onRemoveClick}>
            Remove
            <span className="command">Alt + Click</span>
          </li>
          <li onClick={buildOnAddClick(1)}>
            Add 1<span className="command">Click</span>
          </li>
          <li onClick={buildOnAddClick(5)}>Add 5</li>
        </ul>
      )}
    </div>
  );
};

type GuideProps = {
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
};
const Guide = ({ position }: GuideProps) => {
  return (
    <div className={`guide ${position}`}>
      <div className="content">
        <div className="inner" />
        <div className="outer" />
      </div>
    </div>
  );
};
