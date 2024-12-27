"use client";

import SignIn from "./_sign-in";
import { SignUp } from "./_sign-up";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useState } from "react";

export default function Page() {
  const [selectedTab, setSelectedTab] = useState("sign-in");

  const onTabChange = (value: string) => {
    setSelectedTab(value);
  };

  return (
    <Tabs value={selectedTab} className="w-[400px]" onValueChange={onTabChange}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="sign-in">Sign In</TabsTrigger>
        <TabsTrigger value="sign-up">Sign Up</TabsTrigger>
      </TabsList>
      <TabsContent value="sign-in">
        <SignIn />
      </TabsContent>
      <TabsContent value="sign-up">
        <SignUp handleTabChange={onTabChange} />
      </TabsContent>
    </Tabs>
  );
}
