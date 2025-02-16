import {
  ComponentProps,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Image, ImagesContext } from "./ImagesContext";

export const ImagesProvider = (
  props: Omit<ComponentProps<typeof ImagesContext.Provider>, "value">
) => {
  const [images, setImages] = useState<Image[]>([]);

  useEffect(() => {
    return () => {
      images.forEach((img) => {
        if (img.src) {
          URL.revokeObjectURL(img.src);
        }
      });
    };
  });

  const onRemove = useCallback((index: number) => {
    setImages((old) => old.filter((_, i) => i !== index));
  }, []);

  const onAdd = useCallback((images: Image[], index?: number) => {
    setImages((old) => {
      if (index === undefined) {
        return old.concat(images);
      }
      
      return old.toSpliced(index, 0, ...images);
    });
  }, []);

  const contextValue = useMemo(
    () => ({ images, setImages, onRemove, onAdd }),
    [images, setImages, onRemove, onAdd]
  );

  return <ImagesContext.Provider {...props} value={contextValue} />;
};
