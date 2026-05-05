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
  centerId: z.string().min(1, "Choose a center"),
  masterId: z.string().min(1, "Choose your Lv 1 master"),
  titleEn: z.string().optional(),
  fullNameEn: z.string().optional(),
  idOrPassport: z.string().optional(),
  contentSubject: z.string().optional(),
  academicPerformance: z.string().optional(),
  completionDate: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function optionalString(value?: string) {
  if (!value) return undefined;
  return value;
}

export function StudentRegistrationForm() {
  const router = useRouter();
  const create = api.student.create.useMutation();
  const centers = api.center.listApproved.useQuery();

  const [idCardKey, setIdCardKey] = useState<string | null>(null);
  const [paymentSlipKey, setPaymentSlipKey] = useState<string | null>(null);
  const [applicationKey, setApplicationKey] = useState<string | null>(null);
  const [photoKey, setPhotoKey] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      centerId: "",
      masterId: "",
      titleEn: "",
      fullNameEn: "",
      idOrPassport: "",
      contentSubject: "",
      academicPerformance: "",
      completionDate: "",
      notes: "",
    },
  });

  const centerId = form.watch("centerId");
  const masters = api.master.listApprovedLv1ByCenter.useQuery(
    { centerId },
    { enabled: !!centerId },
  );

  async function onSubmit(values: FormValues) {
    try {
      await create.mutateAsync({
        masterId: values.masterId,
        titleEn: optionalString(values.titleEn),
        fullNameEn: optionalString(values.fullNameEn),
        idOrPassport: optionalString(values.idOrPassport),
        contentSubject: optionalString(values.contentSubject),
        academicPerformance: optionalString(values.academicPerformance),
        completionDate: values.completionDate
          ? new Date(values.completionDate)
          : undefined,
        notes: optionalString(values.notes),
        studentIdCardUrl: idCardKey,
        paymentSlipUrl: paymentSlipKey,
        applicationUrl: applicationKey,
        photoUrl: photoKey,
      });
      toast.success("Student application submitted.");
      router.push("/dashboard/student");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Submission failed.");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
        <section className="grid gap-4 rounded-2xl border bg-white p-6">
          <h2 className="text-base font-semibold">Center & master</h2>
          <FormField
            control={form.control}
            name="centerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Center</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v);
                    form.setValue("masterId", "");
                  }}
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
            name="masterId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Master (Lv 1)</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={!centerId || masters.isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          !centerId
                            ? "Choose a center first"
                            : masters.isLoading
                              ? "Loading…"
                              : "Choose your master"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(masters.data ?? []).map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {(m.firstNameEn ?? "") + " " + (m.lastNameEn ?? "")}
                        {m.masterCode ? ` — ${m.masterCode}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <section className="grid gap-4 rounded-2xl border bg-white p-6">
          <h2 className="text-base font-semibold">Identity</h2>
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
              name="fullNameEn"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Full name (English)</FormLabel>
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
            name="idOrPassport"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ID / Passport number</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <section className="grid gap-4 rounded-2xl border bg-white p-6">
          <h2 className="text-base font-semibold">Course</h2>
          <FormField
            control={form.control}
            name="contentSubject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Content subject</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={3} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="academicPerformance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Academic performance</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={3} />
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
        </section>

        <section className="grid gap-4 rounded-2xl border bg-white p-6">
          <h2 className="text-base font-semibold">Documents</h2>
          <div className="grid gap-2">
            <p className="text-sm font-medium">Student ID card</p>
            <FileUpload
              prefix="students/"
              value={idCardKey}
              onChange={setIdCardKey}
              label="Upload ID"
            />
          </div>
          <div className="grid gap-2">
            <p className="text-sm font-medium">Payment slip</p>
            <FileUpload
              prefix="students/"
              value={paymentSlipKey}
              onChange={setPaymentSlipKey}
              label="Upload slip"
            />
          </div>
          <div className="grid gap-2">
            <p className="text-sm font-medium">Application form</p>
            <FileUpload
              prefix="students/"
              value={applicationKey}
              onChange={setApplicationKey}
              label="Upload application"
            />
          </div>
          <div className="grid gap-2">
            <p className="text-sm font-medium">Photo</p>
            <FileUpload
              prefix="students/"
              value={photoKey}
              onChange={setPhotoKey}
              label="Upload photo"
            />
          </div>
        </section>

        <section className="grid gap-4 rounded-2xl border bg-white p-6">
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={3} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

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
