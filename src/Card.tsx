import { useContext, useEffect, useRef, useState } from 'react';
import './Card.css'
import { Image, ImagesContext } from './ImagesContext';

export type CardProps = {
  image: Image
} & React.HTMLAttributes<HTMLDivElement>

export const Card = ({ className, image, ...restProps }: CardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const { images, onAdd, onRemove, isRendering } = useContext(ImagesContext)

  const [src, setSrc] = useState<string>('')

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    if (cardRef.current && !isRendering) {
      const rect = cardRef.current.getBoundingClientRect();
      setMenuPosition({ x: event.clientX - rect.left, y: event.clientY - rect.top });
      setMenuVisible(true);
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setMenuVisible(false);
    }
  };

  const buildAdd = (count: number) => () => {
    if (image.file) {
      const index = images.indexOf(image)
      onAdd(new Array<File>(count).fill(image.file), index + 1)
      setMenuVisible(false)
    }
  }

  const handleRemove = () => {
    onRemove(image.uuid)
    setMenuVisible(false)
  }

  useEffect(() => {
    if (menuVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuVisible]);

  

  useEffect(() => {
    const blob = image.file ? URL.createObjectURL(image.file) : ''
    setSrc(blob)
    return () => {
      if (blob) {
        setSrc('')
        URL.revokeObjectURL(blob)
      }
    }
  }, [image])

  return (
    <div className={`card ${className}`} {...restProps} ref={cardRef}>
      <div className="image-container">
        {image.file && src ? (
          <img
            src={src}
            alt={image.file.name}
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
          <li onClick={handleRemove}>
            Remove
          </li>
          <li onClick={buildAdd(1)}>Add 1</li>
          <li onClick={buildAdd(5)}>Add 5</li>
        </ul>
      )}
    </div>
)
  }
