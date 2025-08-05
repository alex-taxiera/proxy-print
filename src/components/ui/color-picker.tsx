import { forwardRef } from "react";
import * as Styled from "./styled/color-picker";
import { Field } from "./field";
import { IconButton } from "./icon-button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEyeDropper } from "@fortawesome/free-solid-svg-icons";
import { css } from "styled-system/css";
import { stack, hstack } from "styled-system/patterns";

const presets = [
  "hsl(10, 81%, 59%)",
  "hsl(60, 81%, 59%)",
  "hsl(100, 81%, 59%)",
  "hsl(175, 81%, 59%)",
  "hsl(190, 81%, 59%)",
  "hsl(205, 81%, 59%)",
  "hsl(220, 81%, 59%)",
  "hsl(250, 81%, 59%)",
  "hsl(280, 81%, 59%)",
  "hsl(350, 81%, 59%)",
];

export const ColorPicker = forwardRef<HTMLDivElement, Styled.RootProps>(
  (props, ref) => (
    <Styled.Root {...props} ref={ref}>
      <Styled.Context>
        {(api) => (
          <>
            <Styled.Label>Color Picker</Styled.Label>
            <Styled.Control>
              <Styled.ChannelInput channel="hex" asChild>
                <Field.Input />
              </Styled.ChannelInput>
              <Styled.Trigger asChild>
                <IconButton aria-label="Pick a color" variant="outline">
                  <Styled.Swatch value={api.value} />
                </IconButton>
              </Styled.Trigger>
            </Styled.Control>
            <Styled.Positioner>
              <Styled.Content>
                <div className={stack({ gap: "3" })}>
                  <Styled.Area>
                    <Styled.AreaBackground />
                    <Styled.AreaThumb />
                  </Styled.Area>
                  <div className={hstack({ gap: "3" })}>
                    <Styled.EyeDropperTrigger asChild>
                      <IconButton
                        size="xs"
                        variant="outline"
                        aria-label="Pick a color"
                      >
                        <FontAwesomeIcon icon={faEyeDropper} />
                      </IconButton>
                    </Styled.EyeDropperTrigger>
                    <div className={stack({ gap: "2", flex: "1" })}>
                      <Styled.ChannelSlider channel="hue">
                        <Styled.ChannelSliderTrack />
                        <Styled.ChannelSliderThumb />
                      </Styled.ChannelSlider>
                      <Styled.ChannelSlider channel="alpha">
                        <Styled.TransparencyGrid size="8px" />
                        <Styled.ChannelSliderTrack />
                        <Styled.ChannelSliderThumb />
                      </Styled.ChannelSlider>
                    </div>
                  </div>
                  <div className={hstack({ gap: "3" })}>
                    <Styled.ChannelInput channel="hex" asChild>
                      <Field.Input size="2xs" />
                    </Styled.ChannelInput>
                    <Styled.ChannelInput channel="alpha" asChild>
                      <Field.Input size="2xs" />
                    </Styled.ChannelInput>
                  </div>
                  <div className={stack({ gap: "1.5" })}>
                    <div
                      className={css({
                        fontWeight: "medium",
                        fontSize: "xs",
                        color: "fg.default",
                      })}
                    >
                      Saved Colors
                    </div>
                    <Styled.SwatchGroup>
                      {presets.map((color, id) => (
                        <Styled.SwatchTrigger key={id} value={color}>
                          <Styled.Swatch value={color} />
                        </Styled.SwatchTrigger>
                      ))}
                    </Styled.SwatchGroup>
                  </div>
                </div>
              </Styled.Content>
            </Styled.Positioner>
          </>
        )}
      </Styled.Context>
      <Styled.HiddenInput />
    </Styled.Root>
  ),
);
ColorPicker.displayName = "ColorPicker";
