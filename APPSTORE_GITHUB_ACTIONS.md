# GitHub Actions ile iOS build ve upload

Bu repo icin `.github/workflows/ios-appstore.yml` dosyasi App Store Connect upload akisini hazirlar.

Gerekli GitHub Secrets:

- `APPLE_TEAM_ID`
- `IOS_DIST_P12_BASE64`
- `IOS_DIST_P12_PASSWORD`
- `IOS_APPSTORE_PROFILE_BASE64`
- `IOS_PROFILE_NAME`
- `APPSTORE_API_KEY_ID`
- `APPSTORE_API_ISSUER_ID`
- `APPSTORE_API_PRIVATE_KEY_BASE64`

Hazirlaman gereken Apple taraflari:

1. Apple Developer hesabinda App ID olustur.
2. App Store distribution certificate olustur ve `.p12` olarak export et.
3. App Store provisioning profile olustur.
4. App Store Connect API key olustur ve `.p8` dosyasini indir.
5. Bu dosyalari base64 cevirip GitHub Secrets'a koy.

PowerShell ile base64 alma:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\path\file.p12"))
```

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\path\profile.mobileprovision"))
```

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\path\AuthKey_KEYID.p8"))
```

Calistirma:

1. Repo'yu GitHub'a public olarak push et.
2. `Settings > Secrets and variables > Actions` icinde secretlari ekle.
3. `Actions` sekmesinden `ios-appstore` workflow'unu elle calistir.

Notlar:

- Bu akista iOS klasoru yoksa workflow olusturur.
- Ilk denemede signing hatasi alma ihtimali en yuksek yer certificate/profile eslesmesidir.
- App Store Connect kaydi onceden olusturulmus olmali.
