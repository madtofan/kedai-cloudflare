"use client";

import imageCompression from "browser-image-compression";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { PasswordInput } from "~/components/ui/password-input";
import { useState } from "react";
import { client } from "~/lib/auth-client";
import Image from "next/image";
import { Loader2, X } from "lucide-react";
import { useToast } from "~/lib/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";

const formSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(6),
    confirmationPassword: z.string().min(6),
    firstName: z.string().min(1),
    lastName: z.string().optional(),
    image: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmationPassword, {
    message: "Given password does not match confirmation pasword",
    path: ["confirmationPassword"],
  });

export function SignUp({
  handleTabChange,
}: {
  handleTabChange: (value: string) => void;
}) {
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmationPassword: "",
      firstName: "",
      lastName: "",
      image: undefined,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await client.signUp.email({
      email: values.email,
      password: values.password,
      name: `${values.firstName} ${values.lastName}`,
      image: values.image,
      callbackURL: "/dashboard",
      fetchOptions: {
        onResponse: () => {
          setLoading(false);
          toast({
            title: "Success",
            description:
              "Created a new account, please login with newly created credentials",
            variant: "default",
          });
          handleTabChange("sign-in");
        },
        onRequest: () => {
          setLoading(true);
        },
        onError: (ctx) => {
          toast({
            title: "Error Signing Up",
            description: ctx.error.message,
            variant: "destructive",
          });
        },
      },
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      })
        .then((compressedFile) => {
          convertImageToBase64(compressedFile)
            .then((base64String) => {
              form.setValue("image", base64String);
            })
            .catch(() => {
              toast({
                variant: "destructive",
                title: "Error",
                description: "An error occured compressing the selected image.",
              });
            });
          const reader = new FileReader();
          reader.onloadend = () => {
            setImagePreview(reader.result as string);
          };
          reader.readAsDataURL(compressedFile);
        })
        .catch(() => {
          toast({
            variant: "destructive",
            title: "Error",
            description: "An error occured loading the selected image.",
          });
        });
    }
  };

  const handleClearImage = () => {
    form.setValue("image", undefined);
    setImagePreview(null);
  };

  const [loading, setLoading] = useState(false);

  return (
    <Card className="z-50 max-w-md">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">Sign Up</CardTitle>
        <CardDescription className="text-xs md:text-sm">
          Enter your information to create an account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem className="space-y-0">
                      <FormLabel>First name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-2">
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem className="space-y-0">
                      <FormLabel>Last name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-2">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        {...field}
                        autoComplete="password"
                        placeholder="Password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-2">
              <FormField
                control={form.control}
                name="confirmationPassword"
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        {...field}
                        autoComplete="password"
                        placeholder="Password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image">Profile Image (optional)</Label>
              <div className="flex items-end gap-4">
                {imagePreview && (
                  <div className="relative h-16 w-16 overflow-hidden rounded-sm">
                    <Image
                      src={imagePreview}
                      alt="Profile preview"
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                )}
                <div className="flex w-full items-center gap-2">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full"
                  />
                  {imagePreview && (
                    <X className="cursor-pointer" onClick={handleClearImage} />
                  )}
                </div>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                "Create an account"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

async function convertImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
