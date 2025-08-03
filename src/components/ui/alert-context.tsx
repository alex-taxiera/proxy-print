import { createContext, useContext } from "react";
import { AlertVariant } from "styled-system/recipes";

type AlertContextValue = AlertVariant;

const AlertContext = createContext<AlertContextValue>({
  status: "info",
});

export const AlertProvider = ({
  children,
  ...value
}: React.PropsWithChildren<AlertContextValue>) => {
  return (
    <AlertContext.Provider value={value}>{children}</AlertContext.Provider>
  );
};

export const useAlertContext = () => {
  return useContext(AlertContext);
};
