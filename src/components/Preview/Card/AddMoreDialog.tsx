import { Button } from "@chakra-ui/react";

import {
  DialogRootProps,
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogActionTrigger,
  DialogCloseTrigger,
} from "@/components/ui/dialog";
import {
  NumberInputField,
  NumberInputRoot,
} from "@/components/ui/number-input";

export interface AddMoreDialogProps extends Partial<DialogRootProps> {
  add: (count: number) => void;
}

export const AddMoreDialog = ({
  add,
  children,
  ...props
}: AddMoreDialogProps) => {
  return (
    <DialogRoot {...props}>
      {children}
      <DialogContent asChild>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const count = parseInt(formData.get("count") as string);
            add(count);
          }}
        >
          <DialogHeader>Add copies</DialogHeader>
          <DialogBody>
            <NumberInputRoot name="count" defaultValue="3" showSteppers>
              <NumberInputField />
            </NumberInputRoot>
          </DialogBody>
          <DialogFooter>
            <DialogActionTrigger asChild>
              <Button type="submit">Submit</Button>
            </DialogActionTrigger>
          </DialogFooter>
          <DialogCloseTrigger aria-label="Close" />
        </form>
      </DialogContent>
    </DialogRoot>
  );
};
