import { useContext, useEffect, useRef, useState } from 'react';
import './Card.css'
import { Image, ImagesContext } from './ImagesContext';

export type CardProps = {
  image: { name: string, src?: string}
  index: number
} & React.HTMLAttributes<HTMLDivElement>

export const Card = ({ className, image, index, ...restProps }: CardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const { onAdd, onRemove } = useContext(ImagesContext)

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setMenuPosition({ x: event.clientX - rect.left, y: event.clientY - rect.top });
    }
    setMenuVisible(true);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setMenuVisible(false);
    }
  };

  const buildAdd = (count: number) => () => {
    onAdd(new Array<Image>(count).fill(image), index)
    setMenuVisible(false)
  }

  const handleRemove = () => {
    onRemove(index)
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

  return (
    <div className={`card ${className}`} {...restProps} ref={cardRef}>
      <div className="image-container">
        {image.src ? (
          <img
            src={image.src}
            alt={image.name}
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
