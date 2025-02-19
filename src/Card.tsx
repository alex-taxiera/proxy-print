import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import "./Card.css";
import { Image, ImagesContext } from "./context/ImagesContext";

export type CardProps = {
  image: Image;
} & React.HTMLAttributes<HTMLDivElement>;

export const Card = ({ className, image, ...restProps }: CardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const { images, onAdd, onRemove, isRendering } = useContext(ImagesContext);

  const [src, setSrc] = useState<string>("");

  const isEmpty = !image.file || !src;

  const add = useCallback(
    (count: number) => {
      if (image.file) {
        const index = images.indexOf(image);
        onAdd(new Array<File>(count).fill(image.file), index + 1);
      }
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
      if (isEmpty) {
        return;
      }

      if (event.altKey) {
        onRemove(image.uuid);
      } else {
        add(1);
      }
    },
    [isEmpty, onRemove, image, add]
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
    const blob = image.file ? URL.createObjectURL(image.file) : "";
    setSrc(blob);
    return () => {
      if (blob) {
        setSrc("");
        URL.revokeObjectURL(blob);
      }
    };
  }, [image]);

  return (
    <div
      className={`card ${isEmpty ? "empty" : ""} ${className}`}
      {...restProps}
      ref={cardRef}
      onClick={handleClick}
    >
      <div className="image-container">
        {!isEmpty ? (
          <img
            src={src}
            alt={image.file!.name}
            className="image"
            onContextMenu={handleContextMenu}
          />
        ) : (
          <span className="empty" />
        )}
      </div>
      <div className="guide top-left"></div>
      <div className="guide top-right"></div>
      <div className="guide bottom-left"></div>
      <div className="guide bottom-right"></div>
      {menuVisible && (
        <ul
          ref={menuRef}
          className="context-menu"
          style={{ top: menuPosition.y, left: menuPosition.x }}
        >
          <li className="destructive" onClick={onRemoveClick}>
            Remove
            <span className="command">Alt + Click</span>
          </li>
          <li onClick={buildOnAddClick(1)}>Add 1
            <span className="command">Click</span>
          </li>
          <li onClick={buildOnAddClick(5)}>Add 5</li>
        </ul>
      )}
    </div>
  );
};
