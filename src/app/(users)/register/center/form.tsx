"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { FileUpload } from "~/components/file-upload";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { api } from "~/trpc/react";

const formSchema = z.object({
  name: z.string().min(2, "Required"),
  address: z.string().optional(),
  directorTitle: z.string().optional(),
  directorName: z.string().optional(),
  directorIdCard: z.string().optional(),
  vocationalFields: z.string().optional(),
  contents: z.string().optional(),
  appointmentNumber: z.string().optional(),
  appointmentDate: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function optionalString(value?: string) {
  if (!value) return undefined;
  return value;
}

export function CenterRegistrationForm() {
  const router = useRouter();
  const create = api.center.create.useMutation();

  const [idCardKey, setIdCardKey] = useState<string | null>(null);
  const [paymentSlipKey, setPaymentSlipKey] = useState<string | null>(null);
  const [photoKey, setPhotoKey] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      address: "",
      directorTitle: "",
      directorName: "",
      directorIdCard: "",
      vocationalFields: "",
      contents: "",
      appointmentNumber: "",
      appointmentDate: "",
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      await create.mutateAsync({
        name: values.name,
        address: optionalString(values.address),
        directorTitle: optionalString(values.directorTitle),
        directorName: optionalString(values.directorName),
        directorIdCard: optionalString(values.directorIdCard),
        vocationalFields: values.vocationalFields
          ? values.vocationalFields
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        contents: values.contents
          ? values.contents
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        appointmentNumber: optionalString(values.appointmentNumber),
        appointmentDate: values.appointmentDate
          ? new Date(values.appointmentDate)
          : undefined,
        idCardUrl: idCardKey,
        paymentSlipUrl: paymentSlipKey,
        photoUrl: photoKey,
      });
      toast.success("Center submitted for approval.");
      router.push("/dashboard/center");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Submission failed.");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Center</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Center name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="K-Beauty Bangkok" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={3} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Director</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="directorTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Mr / Ms / Dr" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="directorName"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="directorIdCard"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Director ID card number</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operations</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
          <FormField
            control={form.control}
            name="vocationalFields"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vocational fields</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="comma-separated, e.g. Skincare, Makeup"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contents"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Course contents</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={4} placeholder="One per line" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="appointmentNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Appointment number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="appointmentDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Appointment date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <p className="text-sm font-medium">Director ID card</p>
            <FileUpload
              prefix="centers/"
              value={idCardKey}
              onChange={setIdCardKey}
              label="Upload ID card"
            />
          </div>
          <div className="grid gap-2">
            <p className="text-sm font-medium">Payment slip</p>
            <FileUpload
              prefix="centers/"
              value={paymentSlipKey}
              onChange={setPaymentSlipKey}
              label="Upload slip"
            />
          </div>
          <div className="grid gap-2">
            <p className="text-sm font-medium">Photo / logo</p>
            <FileUpload
              prefix="centers/"
              value={photoKey}
              onChange={setPhotoKey}
              label="Upload photo"
            />
          </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            type="submit"
            disabled={create.isPending || form.formState.isSubmitting}
          >
            {create.isPending ? "Submitting…" : "Submit for approval"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
