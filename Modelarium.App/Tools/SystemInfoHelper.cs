using System.Diagnostics;
using System.Runtime.InteropServices;

namespace Modelarium.App.Tools
{
    public static class SystemInfoHelper
    {
        public static long GetTotalPhysicalMemory()
        {
            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            {
                return GetTotalMemoryWindows();
            }
            else if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
            {
                return GetTotalMemoryLinux();
            }
            else if (RuntimeInformation.IsOSPlatform(OSPlatform.OSX))
            {
                return GetTotalMemoryMac();
            }

            throw new NotSupportedException("Unsupported OS");
        }

        private static long GetTotalMemoryWindows()
        {
            if (GetPhysicallyInstalledSystemMemory(out long memoryKb))
            {
                return memoryKb * 1024; // Convert KB to Bytes
            }
            throw new Exception("Unable to determine total memory on Windows.");
        }

        private static long GetTotalMemoryLinux()
        {
            try
            {
                var memInfo = File.ReadAllLines("/proc/meminfo");
                var memTotalLine = memInfo.FirstOrDefault(line => line.StartsWith("MemTotal"));
                if (memTotalLine != null)
                {
                    var parts = memTotalLine.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
                    if (parts.Length >= 2 && long.TryParse(parts[1], out long memKb))
                    {
                        return memKb * 1024; // Convert KB to Bytes
                    }
                }
            }
            catch { }
            throw new Exception("Unable to determine total memory on Linux.");
        }

        private static long GetTotalMemoryMac()
        {
            try
            {
                var output = ExecuteBashCommand("sysctl hw.memsize");
                var parts = output.Split(':');
                if (parts.Length == 2 && long.TryParse(parts[1].Trim(), out long memBytes))
                {
                    return memBytes;
                }
            }
            catch { }
            throw new Exception("Unable to determine total memory on macOS.");
        }

        private static string ExecuteBashCommand(string command)
        {
            using var process = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = "/bin/bash",
                    Arguments = $"-c \"{command}\"",
                    RedirectStandardOutput = true,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                }
            };
            process.Start();
            string result = process.StandardOutput.ReadToEnd();
            process.WaitForExit();
            return result;
        }

        [DllImport("kernel32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool GetPhysicallyInstalledSystemMemory(out long totalMemoryInKilobytes);
    }

}
