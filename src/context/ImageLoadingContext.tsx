import { createContext } from "react";

import { useImageLoadingProgress } from "~/hooks/useImageLoadingProgress";

export const ImageLoadingContext = createContext({
  isLoadingImages: false,
});

export const ImageLoadingProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const isLoadingImages = useImageLoadingProgress();

  return (
    <ImageLoadingContext.Provider value={{ isLoadingImages }}>
      {children}
    </ImageLoadingContext.Provider>
  );
};
