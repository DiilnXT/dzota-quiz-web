$gitPath = 'C:\Users\lenha\AppData\Local\GitHubDesktop\app-3.6.6\resources\app\git\cmd\git.exe'
& $gitPath add -A
& $gitPath commit -m 'feat: smart single-display notification alert with elegant card design'

Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
using System.Text;

public class CredManagerPush {
    [DllImport("Advapi32.dll", EntryPoint = "CredReadW", CharSet = CharSet.Unicode, SetLastError = true)]
    public static extern bool CredRead(string target, int type, int reservedFlag, out IntPtr credentialPtr);

    [DllImport("Advapi32.dll", EntryPoint = "CredFree", SetLastError = true)]
    public static extern void CredFree(IntPtr credentialPtr);

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct CREDENTIAL {
        public int Flags;
        public int Type;
        public string TargetName;
        public string Comment;
        public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
        public int CredentialBlobSize;
        public IntPtr CredentialBlob;
        public int Persist;
        public int AttributeCount;
        public IntPtr Attributes;
        public string TargetAlias;
        public string UserName;
    }

    public static string GetPassword(string target) {
        IntPtr credPtr;
        if (CredRead(target, 1, 0, out credPtr)) {
            CREDENTIAL cred = (CREDENTIAL)Marshal.PtrToStructure(credPtr, typeof(CREDENTIAL));
            byte[] blob = new byte[cred.CredentialBlobSize];
            Marshal.Copy(cred.CredentialBlob, blob, 0, cred.CredentialBlobSize);
            CredFree(credPtr);
            return Encoding.UTF8.GetString(blob);
        }
        return null;
    }
}
'@

$pass = [CredManagerPush]::GetPassword("GitHub - https://api.github.com/DiilnXT")
if (-not $pass) {
    Write-Error "Failed to retrieve GitHub token from Credential Manager."
    exit 1
}

& $gitPath -c credential.helper= push "https://${pass}@github.com/DiilnXT/dzota-quiz-web.git" main
