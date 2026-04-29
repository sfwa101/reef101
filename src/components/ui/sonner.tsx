import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      duration={2200}
      position="top-center"
      visibleToasts={3}
      gap={10}
      offset={72}
      closeButton={false}
      toastOptions={{
        unstyled: false,
        classNames: {
          toast:
            "group toast !rounded-2xl !border !border-primary/15 !bg-card/95 !text-foreground !shadow-[0_18px_40px_-18px_hsl(var(--primary)/0.35)] backdrop-blur-xl",
          title: "!font-extrabold !text-[13.5px] !leading-tight",
          description: "!text-muted-foreground !text-[12px] !mt-0.5",
          actionButton:
            "!bg-primary !text-primary-foreground !rounded-full !px-3 !py-1.5 !text-[11.5px] !font-extrabold !shadow-pill active:!scale-[0.97] transition",
          cancelButton:
            "!bg-foreground/5 !text-foreground/80 !rounded-full !px-3 !py-1.5 !text-[11.5px] !font-bold",
          success: "!border-primary/25",
          error: "!border-destructive/30",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
