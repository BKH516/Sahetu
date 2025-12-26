import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "./dialog";

interface DialogCustomProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: React.ReactNode;
}

const DialogCustom: React.FC<DialogCustomProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white max-h-[80vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-gray-900 dark:text-white text-lg">{title}</DialogTitle>
          <DialogDescription className="text-gray-700 dark:text-gray-300 text-sm">{description}</DialogDescription>
        </DialogHeader>
        <div className="py-2">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DialogCustom; 