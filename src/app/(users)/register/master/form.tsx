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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { api } from "~/trpc/react";

const formSchema = z.object({
  centerId: z.string().min(1, "Please choose a center"),
  desiredLevel: z.number().int().min(1).max(99),
  titleTh: z.string().optional(),
  firstNameTh: z.string().optional(),
  lastNameTh: z.string().optional(),
  titleEn: z.string().optional(),
  firstNameEn: z.string().optional(),
  lastNameEn: z.string().optional(),
  idCardNumber: z.string().optional(),
  completedCourse: z.string().optional(),
  completedCourseOther: z.string().optional(),
  certificateRequestDate: z.string().optional(),
  completionDate: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function optionalString(value?: string) {
  if (!value) return undefined;
  return value;
}

export function MasterRegistrationForm() {
  const router = useRouter();
  const create = api.master.create.useMutation();
  const centers = api.center.listApproved.useQuery();

  const [idCardKey, setIdCardKey] = useState<string | null>(null);
  const [photoKey, setPhotoKey] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      centerId: "",
      desiredLevel: 1,
      titleTh: "",
      firstNameTh: "",
      lastNameTh: "",
      titleEn: "",
      firstNameEn: "",
      lastNameEn: "",
      idCardNumber: "",
      completedCourse: "",
      completedCourseOther: "",
      certificateRequestDate: "",
      completionDate: "",
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      await create.mutateAsync({
        centerId: values.centerId,
        desiredLevel: Number(values.desiredLevel),
        titleTh: optionalString(values.titleTh),
        firstNameTh: optionalString(values.firstNameTh),
        lastNameTh: optionalString(values.lastNameTh),
        titleEn: optionalString(values.titleEn),
        firstNameEn: optionalString(values.firstNameEn),
        lastNameEn: optionalString(values.lastNameEn),
        idCardNumber: optionalString(values.idCardNumber),
        completedCourse: optionalString(values.completedCourse),
        completedCourseOther: optionalString(values.completedCourseOther),
        certificateRequestDate: values.certificateRequestDate
          ? new Date(values.certificateRequestDate)
          : undefined,
        completionDate: values.completionDate
          ? new Date(values.completionDate)
          : undefined,
        idCardUrl: idCardKey,
        photoUrl: photoKey,
      });
      toast.success("Master application submitted.");
      router.push("/dashboard/master");
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
            <CardTitle>Center & level</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
          <FormField
            control={form.control}
            name="centerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Center</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={centers.isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a center" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(centers.data ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.code} — {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="desiredLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Desired level</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={99}
                    {...field}
                    onChange={(event) =>
                      field.onChange(event.currentTarget.valueAsNumber)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Name (Thai)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="titleTh"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>คำนำหน้า</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="firstNameTh"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ชื่อ</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastNameTh"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>นามสกุล</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
            <CardTitle>Name (English)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="titleEn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="firstNameEn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastNameEn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last name</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
            <CardTitle>Course history</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
          <FormField
            control={form.control}
            name="idCardNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ID card number</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="completedCourse"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Completed course</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="completedCourseOther"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Other course details</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={3} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="certificateRequestDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Certificate request date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="completionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Completion date</FormLabel>
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
            <p className="text-sm font-medium">ID card</p>
            <FileUpload
              prefix="masters/"
              value={idCardKey}
              onChange={setIdCardKey}
              label="Upload ID card"
            />
          </div>
          <div className="grid gap-2">
            <p className="text-sm font-medium">Photo</p>
            <FileUpload
              prefix="masters/"
              value={photoKey}
              onChange={setPhotoKey}
              label="Upload photo"
            />
          </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
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
