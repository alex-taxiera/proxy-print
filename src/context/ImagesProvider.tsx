import { ComponentProps, useCallback, useMemo, useState } from "react";
import { GoogleImageData, Image, ImagesContext } from "./ImagesContext";
import { nanoid } from "nanoid";

export const ImagesProvider = (
  props: Omit<ComponentProps<typeof ImagesContext.Provider>, "value">
) => {
  const [images, setImages] = useState<Image[]>([]);
  const [isRendering, setIsRendering] = useState(false);

  const onRemove = useCallback((uuid: string) => {
    setImages((old) => old.filter((image) => image.uuid !== uuid));
  }, []);

  const onClear = useCallback(() => {
    setImages([]);
  }, []);

  const onAdd = useCallback((data: (File | GoogleImageData)[], index?: number) => {
    setImages((old) => {
      const images = data.map((item) => {
        if (item instanceof File) {
          return { uuid: nanoid(), file: item };
        }

        return { uuid: nanoid(), ...item };
      });
      if (index === undefined) {
        return old.concat(images);
      }

      return old.toSpliced(index, 0, ...images);
    });
  }, []);

  const contextValue = useMemo(
    () => ({ images, onClear, onRemove, onAdd, isRendering, setIsRendering }),
    [images, onClear, onRemove, onAdd, isRendering, setIsRendering]
  );

  return <ImagesContext.Provider {...props} value={contextValue} />;
};
