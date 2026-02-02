
export enum AttendanceStatus {
  HADIR = 'H',
  ALPA = 'A',
  IZIN = 'I',
  SAKIT = 'S',
  EMPTY = ''
}

export type MonthlyAttendance = {
  [day: number]: AttendanceStatus;
};

export type ClassAttendance = {
  [studentId: number]: MonthlyAttendance;
};

export type GlobalStore = {
  [classId: string]: {
    [monthKey: string]: ClassAttendance;
  };
};

export type StudentNameStore = {
  [classId: string]: {
    [studentId: number]: string;
  };
};

export interface MonthOption {
  value: string;
  label: string;
}
