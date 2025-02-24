import { UtensilsCrossed } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-muted/40 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <UtensilsCrossed className="h-10 w-10 text-muted-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl">404</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <h2 className="text-xl font-semibold">
            Looks Like This Dish Isn&apos;t on the Menu
          </h2>
          <p className="text-muted-foreground">
            The page you&apos;re looking for seems to have wandered off to the
            kitchen.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
