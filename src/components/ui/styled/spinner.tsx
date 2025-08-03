import { ark } from "@ark-ui/react/factory";
import { styled } from "styled-system/jsx";
import type { ComponentProps } from "styled-system/types";
import { spinner } from "styled-system/recipes";

export type SpinnerProps = ComponentProps<typeof Spinner>;
export const Spinner = styled(ark.div, spinner);
