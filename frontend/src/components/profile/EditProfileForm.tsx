"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/api";
import { profileSettingsSchema } from "@/lib/validators";
import { authApi } from "@/services/api/auth.api";
import { uploadApi } from "@/services/api/upload.api";
import { usersApi } from "@/services/api/users.api";
import { useAuthStore } from "@/stores/authStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type ProfileSettingsValues = z.input<typeof profileSettingsSchema>;

function toNullable(value: string) {
  return value.trim() ? value.trim() : null;
}

export function EditProfileForm() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const hydratedProfileRef = useRef(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [localAvatarPreview, setLocalAvatarPreview] = useState<string | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);

  const form = useForm<ProfileSettingsValues>({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues: {
      displayName: user?.displayName ?? "",
      username: user?.username ?? "",
      bio: user?.bio ?? "",
      bankName: user?.bankName ?? "",
      bankAccount: user?.bankAccount ?? "",
      bankHolder: user?.bankHolder ?? "",
    },
  });

  const profileQuery = useQuery({
    queryKey: ["auth", "me", "profile-settings"],
    queryFn: async () => {
      const response = await authApi.getMe();
      return response.data.data;
    },
  });

  useEffect(() => {
    const profile = profileQuery.data ?? user;

    if (!profile || hydratedProfileRef.current) {
      return;
    }

    hydratedProfileRef.current = true;
    form.reset({
      displayName: profile.displayName ?? "",
      username: profile.username ?? "",
      bio: profile.bio ?? "",
      bankName: profile.bankName ?? "",
      bankAccount: profile.bankAccount ?? "",
      bankHolder: profile.bankHolder ?? "",
    });
  }, [form, profileQuery.data, user]);

  useEffect(() => {
    return () => {
      if (localAvatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(localAvatarPreview);
      }
    };
  }, [localAvatarPreview]);

  const avatarPreview =
    localAvatarPreview ??
    (removeAvatar ? null : (profileQuery.data?.avatarUrl ?? user?.avatarUrl ?? null));

  const updateProfileMutation = useMutation({
    mutationFn: async (values: ProfileSettingsValues) => {
      const previousAvatarUrl = profileQuery.data?.avatarUrl ?? user?.avatarUrl ?? null;
      let nextAvatarUrl = removeAvatar ? null : previousAvatarUrl;

      if (avatarFile) {
        const uploaded = await uploadApi.uploadFile(avatarFile);
        nextAvatarUrl = uploaded.url;
      }

      const updatedUser = await usersApi.updateMe({
        displayName: values.displayName.trim(),
        username: values.username.trim(),
        bio: toNullable(values.bio),
        avatarUrl: nextAvatarUrl,
        bankName: toNullable(values.bankName),
        bankAccount: toNullable(values.bankAccount),
        bankHolder: toNullable(values.bankHolder),
      });

      if (previousAvatarUrl && previousAvatarUrl !== nextAvatarUrl) {
        void uploadApi.deleteFile(previousAvatarUrl).catch(() => undefined);
      }

      return updatedUser;
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      setAvatarFile(null);
      setRemoveAvatar(false);
      setLocalAvatarPreview(null);
      void queryClient.invalidateQueries({ queryKey: ["auth"] });
      void queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Hồ sơ đã được cập nhật.");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Không thể cập nhật hồ sơ."));
    },
  });

  const isLoading = profileQuery.isLoading;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-0 bg-[radial-gradient(circle_at_top_left,rgba(242,182,94,0.3),transparent_36%),linear-gradient(135deg,color-mix(in_oklab,var(--color-card)_72%,#fff1d8),color-mix(in_oklab,var(--color-card)_94%,transparent))]">
        <CardHeader className="space-y-3">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-card/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">
            <ShieldCheck className="size-4" />
            Profile Settings
          </div>
          <CardTitle className="text-3xl">Chỉnh thông tin hồ sơ và ngân hàng</CardTitle>
          <CardDescription className="max-w-3xl text-base leading-7">
            Avatar, bio, handle và thông tin nhận tiền mặc định đều được lưu từ đây để
            trang cá nhân và các luồng rút tiền bám theo cùng một hồ sơ.
          </CardDescription>
        </CardHeader>
      </Card>

      <form
        onSubmit={form.handleSubmit((values) => updateProfileMutation.mutate(values))}
        className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Ảnh đại diện</CardTitle>
            <CardDescription>Ảnh này sẽ xuất hiện trên navbar, bài viết và hồ sơ công khai.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-col items-center gap-4 rounded-[1.6rem] border border-border/70 bg-card/70 p-5 text-center">
              <Avatar className="size-28 border-4 border-background shadow-md">
                <AvatarImage src={avatarPreview ?? undefined} alt={user?.displayName ?? "Avatar"} />
                <AvatarFallback name={user?.displayName ?? "User"} className="text-2xl" />
              </Avatar>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">
                  {avatarFile ? avatarFile.name : "Chọn ảnh đại diện mới"}
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  Hỗ trợ upload qua backend hiện tại. Nếu xóa ảnh, hệ thống sẽ quay về avatar chữ cái mặc định.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="sr-only">Tải ảnh đại diện</span>
                <Input
                  type="file"
                  accept="image/*"
                  className="cursor-pointer"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;

                    if (!file) {
                      return;
                    }

                    if (localAvatarPreview?.startsWith("blob:")) {
                      URL.revokeObjectURL(localAvatarPreview);
                    }

                    setAvatarFile(file);
                    setRemoveAvatar(false);
                    setLocalAvatarPreview(URL.createObjectURL(file));
                  }}
                />
              </label>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  if (localAvatarPreview?.startsWith("blob:")) {
                    URL.revokeObjectURL(localAvatarPreview);
                  }

                  setAvatarFile(null);
                  setRemoveAvatar(true);
                  setLocalAvatarPreview(null);
                }}
              >
                <Trash2 className="size-4" />
                Xóa ảnh hiện tại
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Thông tin công khai</CardTitle>
              <CardDescription>Những mục này sẽ hiển thị trên trang hồ sơ và bài viết của bạn.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-foreground" htmlFor="displayName">
                  Tên hiển thị
                </label>
                <Input
                  id="displayName"
                  placeholder="Ví dụ: Dinh Nguyen"
                  disabled={isLoading || updateProfileMutation.isPending}
                  {...form.register("displayName")}
                />
                {form.formState.errors.displayName ? (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.displayName.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground" htmlFor="username">
                  Username
                </label>
                <Input
                  id="username"
                  placeholder="your_handle"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  disabled={isLoading || updateProfileMutation.isPending}
                  {...form.register("username", {
                    setValueAs: (value) =>
                      typeof value === "string" ? value.trim().toLowerCase() : "",
                  })}
                />
                {form.formState.errors.username ? (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.username.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground" htmlFor="email">
                  Email
                </label>
                <Input id="email" value={profileQuery.data?.email ?? user?.email ?? ""} disabled />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-foreground" htmlFor="bio">
                  Bio
                </label>
                <Textarea
                  id="bio"
                  placeholder="Chia sẻ một đoạn ngắn về bạn, chuyên môn hoặc chủ đề bạn thường viết."
                  disabled={isLoading || updateProfileMutation.isPending}
                  {...form.register("bio")}
                />
                {form.formState.errors.bio ? (
                  <p className="text-sm text-destructive">{form.formState.errors.bio.message}</p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Ngân hàng mặc định</CardTitle>
              <CardDescription>Dùng để điền sẵn thông tin khi bạn tạo yêu cầu rút tiền.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground" htmlFor="bankName">
                  Tên ngân hàng
                </label>
                <Input
                  id="bankName"
                  placeholder="Vietcombank"
                  disabled={isLoading || updateProfileMutation.isPending}
                  {...form.register("bankName")}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground" htmlFor="bankAccount">
                  Số tài khoản
                </label>
                <Input
                  id="bankAccount"
                  placeholder="0123456789"
                  disabled={isLoading || updateProfileMutation.isPending}
                  {...form.register("bankAccount")}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground" htmlFor="bankHolder">
                  Chủ tài khoản
                </label>
                <Input
                  id="bankHolder"
                  placeholder="NGUYEN VAN A"
                  disabled={isLoading || updateProfileMutation.isPending}
                  {...form.register("bankHolder")}
                />
              </div>

              {form.formState.errors.bankName ? (
                <p className="text-sm text-destructive md:col-span-3">
                  {form.formState.errors.bankName.message}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
              <div className="inline-flex items-start gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <UserRound className="size-5" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Lưu thay đổi vào hồ sơ hiện tại</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Sau khi lưu, navbar, profile page và các phần dùng thông tin người dùng sẽ cập nhật theo hồ sơ mới.
                  </p>
                </div>
              </div>

              <Button type="submit" disabled={isLoading || updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    Lưu hồ sơ
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
