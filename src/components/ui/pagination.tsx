"use client";
import { forwardRef } from "react";
import { Button } from "./button";
import { IconButton } from "./icon-button";
import * as StyledPagination from "./styled/pagination";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

export type PaginationProps = StyledPagination.RootProps;

export const Pagination = forwardRef<HTMLElement, PaginationProps>(
  (props, ref) => {
    return (
      <StyledPagination.Root ref={ref} {...props}>
        <StyledPagination.PrevTrigger asChild>
          <IconButton variant="ghost" aria-label="Next Page">
            <FontAwesomeIcon icon={faChevronLeft} />
          </IconButton>
        </StyledPagination.PrevTrigger>
        <StyledPagination.Context>
          {(pagination) =>
            pagination.pages.map((page, index) =>
              page.type === "page" ? (
                <StyledPagination.Item key={index} {...page} asChild>
                  <Button variant="outline">{page.value}</Button>
                </StyledPagination.Item>
              ) : (
                <StyledPagination.Ellipsis key={index} index={index}>
                  &#8230;
                </StyledPagination.Ellipsis>
              ),
            )
          }
        </StyledPagination.Context>
        <StyledPagination.NextTrigger asChild>
          <IconButton variant="ghost" aria-label="Next Page">
            <FontAwesomeIcon icon={faChevronRight} />
          </IconButton>
        </StyledPagination.NextTrigger>
      </StyledPagination.Root>
    );
  },
);

Pagination.displayName = "Pagination";
