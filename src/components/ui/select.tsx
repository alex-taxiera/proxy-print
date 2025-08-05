import {
  faCheck,
  faChevronDown,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import {
  FontAwesomeIcon,
  FontAwesomeIconProps,
} from "@fortawesome/react-fontawesome";
import { forwardRef } from "react";

import * as Styled from "./styled/select";

export { createListCollection } from "@ark-ui/react/select";

const IndicatorIcon = forwardRef<
  SVGSVGElement,
  Omit<FontAwesomeIconProps, "icon">
>((props, ref) => {
  return <FontAwesomeIcon ref={ref} icon={faChevronDown} {...props} />;
});
IndicatorIcon.displayName = "IndicatorIcon";

const ClearIcon = forwardRef<SVGSVGElement, Omit<FontAwesomeIconProps, "icon">>(
  (props, ref) => {
    return <FontAwesomeIcon ref={ref} icon={faXmark} {...props} />;
  },
);
ClearIcon.displayName = "ClearIcon";

const ItemIndicatorIcon = forwardRef<
  SVGSVGElement,
  Omit<FontAwesomeIconProps, "icon">
>((props, ref) => {
  return <FontAwesomeIcon ref={ref} icon={faCheck} {...props} size="sm" />;
});
ItemIndicatorIcon.displayName = "ItemIndicatorIcon";

export const Select = {
  ...Styled,
  IndicatorIcon,
  ClearIcon,
  ItemIndicatorIcon,
};
