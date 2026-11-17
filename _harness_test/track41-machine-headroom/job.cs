using System; using System.Runtime.InteropServices; using System.Diagnostics;
public static class Job {
  [DllImport("kernel32.dll", CharSet=CharSet.Unicode)] static extern IntPtr CreateJobObject(IntPtr a, string name);
  [DllImport("kernel32.dll", SetLastError=true)] static extern bool SetInformationJobObject(IntPtr job, int infoClass, IntPtr info, uint len);
  [DllImport("kernel32.dll", SetLastError=true)] static extern bool AssignProcessToJobObject(IntPtr job, IntPtr process);
  [StructLayout(LayoutKind.Sequential)] struct BASIC { public long PerProcessUserTimeLimit; public long PerJobUserTimeLimit; public uint LimitFlags; public UIntPtr MinimumWorkingSetSize; public UIntPtr MaximumWorkingSetSize; public uint ActiveProcessLimit; public UIntPtr Affinity; public uint PriorityClass; public uint SchedulingClass; }
  [StructLayout(LayoutKind.Sequential)] struct IO { public ulong a; public ulong b; public ulong c; public ulong d; public ulong e; public ulong f; }
  [StructLayout(LayoutKind.Sequential)] struct EXT { public BASIC Basic; public IO Io; public UIntPtr ProcessMemoryLimit; public UIntPtr JobMemoryLimit; public UIntPtr PeakProcessMemoryUsed; public UIntPtr PeakJobMemoryUsed; }
  // Run one process tree under a commit limit that applies to this tree only; the rest of the machine is untouched.
  public static string Run(string exe, string args, long limitBytes) {
    IntPtr job = CreateJobObject(IntPtr.Zero, null);
    EXT e = new EXT(); e.Basic.LimitFlags = 0x200 | 0x2000; e.JobMemoryLimit = (UIntPtr)(ulong)limitBytes;
    int len = Marshal.SizeOf(typeof(EXT)); IntPtr p = Marshal.AllocHGlobal(len); Marshal.StructureToPtr(e, p, false);
    if (!SetInformationJobObject(job, 9, p, (uint)len)) return "SET_FAILED " + Marshal.GetLastWin32Error();
    ProcessStartInfo psi = new ProcessStartInfo(exe, args); psi.UseShellExecute = false; psi.RedirectStandardOutput = true;
    Process proc = Process.Start(psi);
    if (!AssignProcessToJobObject(job, proc.Handle)) return "ASSIGN_FAILED " + Marshal.GetLastWin32Error();
    string o = proc.StandardOutput.ReadToEnd(); proc.WaitForExit();
    return "exit=" + proc.ExitCode + " " + o;
  }
}
