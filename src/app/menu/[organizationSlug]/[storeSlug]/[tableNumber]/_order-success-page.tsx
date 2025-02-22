import { CheckCircle2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { useMenuContext } from "./_provider";

export default function OrderSuccessPage() {
  const { updateContent } = useMenuContext();

  const handleReturnButtonClick = () => {
    updateContent("browse");
  };

  return (
    <div className="grid min-h-screen place-items-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Order Placed Successfully!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-center">
          <p className="text-muted-foreground">
            Thank you for your order. Your food will be prepared and served to
            your table shortly.
          </p>
          <p className="text-sm text-muted-foreground">
            If you need any assistance, please don&apos;t hesitate to ask our
            staff.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button size="lg" onClick={handleReturnButtonClick}>
            Return to Menu
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
