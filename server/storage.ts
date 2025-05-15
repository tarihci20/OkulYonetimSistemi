import { users, teachers, subjects, classes, periods, schedules, dutyLocations, duties, absences, substitutions, extraLessons, students, studentCourses, homeworkSessions, homeworkAttendance } from "@shared/schema";
import type { User, Teacher, Subject, Class, Period, Schedule, DutyLocation, Duty, Absence, Substitution, ExtraLesson, Student, StudentCourse, HomeworkSession, HomeworkAttendance } from "@shared/schema";
import type { InsertUser, InsertTeacher, InsertSubject, InsertClass, InsertPeriod, InsertSchedule, InsertDutyLocation, InsertDuty, InsertAbsence, InsertSubstitution, InsertExtraLesson, InsertStudent, InsertStudentCourse, InsertHomeworkSession, InsertHomeworkAttendance } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, and, desc, asc, sql } from "drizzle-orm";

const PostgresSessionStore = connectPg(session);
const MemoryStore = createMemoryStore(session);

// Define storage interface
export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  updateUserLastLogin(id: number): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Teacher management
  getAllTeachers(): Promise<Teacher[]>;
  getTeacher(id: number): Promise<Teacher | undefined>;
  createTeacher(teacher: InsertTeacher): Promise<Teacher>;
  updateTeacher(id: number, teacher: Partial<InsertTeacher>): Promise<Teacher | undefined>;
  deleteTeacher(id: number): Promise<boolean>;
  
  // Subject management
  getAllSubjects(): Promise<Subject[]>;
  getSubject(id: number): Promise<Subject | undefined>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  updateSubject(id: number, subject: Partial<InsertSubject>): Promise<Subject | undefined>;
  deleteSubject(id: number): Promise<boolean>;
  
  // Class management
  getAllClasses(): Promise<Class[]>;
  getClass(id: number): Promise<Class | undefined>;
  createClass(classObj: InsertClass): Promise<Class>;
  updateClass(id: number, classObj: Partial<InsertClass>): Promise<Class | undefined>;
  deleteClass(id: number): Promise<boolean>;
  
  // Period management
  getAllPeriods(): Promise<Period[]>;
  getPeriod(id: number): Promise<Period | undefined>;
  createPeriod(period: InsertPeriod): Promise<Period>;
  updatePeriod(id: number, period: Partial<InsertPeriod>): Promise<Period | undefined>;
  deletePeriod(id: number): Promise<boolean>;
  
  // Schedule management
  getAllSchedules(): Promise<Schedule[]>;
  getSchedule(id: number): Promise<Schedule | undefined>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  updateSchedule(id: number, schedule: Partial<InsertSchedule>): Promise<Schedule | undefined>;
  deleteSchedule(id: number): Promise<boolean>;
  getSchedulesByTeacher(teacherId: number): Promise<Schedule[]>;
  getSchedulesByClass(classId: number): Promise<Schedule[]>;
  getSchedulesByDay(dayOfWeek: number): Promise<Schedule[]>;
  
  // Duty location management
  getAllDutyLocations(): Promise<DutyLocation[]>;
  getDutyLocation(id: number): Promise<DutyLocation | undefined>;
  createDutyLocation(location: InsertDutyLocation): Promise<DutyLocation>;
  updateDutyLocation(id: number, location: Partial<InsertDutyLocation>): Promise<DutyLocation | undefined>;
  deleteDutyLocation(id: number): Promise<boolean>;
  
  // Duty management
  getAllDuties(): Promise<Duty[]>;
  getDuty(id: number): Promise<Duty | undefined>;
  createDuty(duty: InsertDuty): Promise<Duty>;
  updateDuty(id: number, duty: Partial<InsertDuty>): Promise<Duty | undefined>;
  deleteDuty(id: number): Promise<boolean>;
  getDutiesByTeacher(teacherId: number): Promise<Duty[]>;
  getDutiesByLocation(locationId: number): Promise<Duty[]>;
  getDutiesByDay(dayOfWeek: number): Promise<Duty[]>;
  
  // Absence management
  getAllAbsences(): Promise<Absence[]>;
  getAbsence(id: number): Promise<Absence | undefined>;
  createAbsence(absence: InsertAbsence): Promise<Absence>;
  updateAbsence(id: number, absence: Partial<InsertAbsence>): Promise<Absence | undefined>;
  deleteAbsence(id: number): Promise<boolean>;
  getAbsencesByTeacher(teacherId: number): Promise<Absence[]>;
  getAbsencesByDate(date: Date): Promise<Absence[]>;
  getActiveAbsences(date: Date): Promise<Absence[]>;
  
  // Substitution management
  getAllSubstitutions(): Promise<Substitution[]>;
  getSubstitution(id: number): Promise<Substitution | undefined>;
  createSubstitution(substitution: InsertSubstitution): Promise<Substitution>;
  updateSubstitution(id: number, substitution: Partial<InsertSubstitution>): Promise<Substitution | undefined>;
  deleteSubstitution(id: number): Promise<boolean>;
  getSubstitutionsByTeacher(teacherId: number): Promise<Substitution[]>;
  getSubstitutionsByDate(date: Date): Promise<Substitution[]>;
  
  // Extra lesson management
  getAllExtraLessons(): Promise<ExtraLesson[]>;
  getExtraLesson(id: number): Promise<ExtraLesson | undefined>;
  createExtraLesson(extraLesson: InsertExtraLesson): Promise<ExtraLesson>;
  updateExtraLesson(id: number, extraLesson: Partial<InsertExtraLesson>): Promise<ExtraLesson | undefined>;
  deleteExtraLesson(id: number): Promise<boolean>;
  getExtraLessonsByTeacher(teacherId: number): Promise<ExtraLesson[]>;
  getExtraLessonsByMonth(month: number, year: number): Promise<ExtraLesson[]>;
  getExtraLessonsReport(month: number, year: number, type?: string): Promise<any[]>;
  
  // Student management
  getAllStudents(): Promise<Student[]>;
  getStudent(id: number): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student | undefined>;
  deleteStudent(id: number): Promise<boolean>;
  
  // Student Course management
  getAllStudentCourses(): Promise<StudentCourse[]>;
  getStudentCoursesForStudent(studentId: number): Promise<StudentCourse[]>;
  getStudentCourse(id: number): Promise<StudentCourse | undefined>;
  createStudentCourse(course: InsertStudentCourse): Promise<StudentCourse>;
  updateStudentCourse(id: number, course: Partial<InsertStudentCourse>): Promise<StudentCourse | undefined>;
  deleteStudentCourse(id: number): Promise<boolean>;
  
  // Homework Session management
  getAllHomeworkSessions(): Promise<HomeworkSession[]>;
  getHomeworkSession(id: number): Promise<HomeworkSession | undefined>;
  createHomeworkSession(session: InsertHomeworkSession): Promise<HomeworkSession>;
  updateHomeworkSession(id: number, session: Partial<InsertHomeworkSession>): Promise<HomeworkSession | undefined>;
  deleteHomeworkSession(id: number): Promise<boolean>;
  
  // Homework Attendance management
  getAllHomeworkAttendance(): Promise<HomeworkAttendance[]>;
  getHomeworkAttendanceByDate(date: string): Promise<HomeworkAttendance[]>;
  getHomeworkAttendanceByStudent(studentId: number): Promise<HomeworkAttendance[]>;
  getHomeworkAttendance(id: number): Promise<HomeworkAttendance | undefined>;
  createHomeworkAttendance(attendance: InsertHomeworkAttendance): Promise<HomeworkAttendance>;
  updateHomeworkAttendance(id: number, attendance: Partial<InsertHomeworkAttendance>): Promise<HomeworkAttendance | undefined>;
  deleteHomeworkAttendance(id: number): Promise<boolean>;
  batchCreateOrUpdateHomeworkAttendance(records: InsertHomeworkAttendance[]): Promise<{ created: number, updated: number }>;
  
  // Session store
  getSessionStore(): Promise<session.Store>;
}

export class DatabaseStorage implements IStorage {
  async getSessionStore() {
    return new PostgresSessionStore({
      pool,
      tableName: 'session',
      createTableIfMissing: true
    });
  }

  // User Methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users).set(userData).where(eq(users.id, id)).returning();
    return result[0];
  }
  
  async updateUserLastLogin(id: number): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }
  
  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  }
  
  // Teacher Methods
  async getAllTeachers(): Promise<Teacher[]> {
    return await db.select().from(teachers);
  }
  
  async getTeacher(id: number): Promise<Teacher | undefined> {
    const result = await db.select().from(teachers).where(eq(teachers.id, id));
    return result[0];
  }
  
  async createTeacher(teacher: InsertTeacher): Promise<Teacher> {
    const result = await db.insert(teachers).values(teacher).returning();
    return result[0];
  }
  
  async updateTeacher(id: number, teacherData: Partial<InsertTeacher>): Promise<Teacher | undefined> {
    const result = await db.update(teachers).set(teacherData).where(eq(teachers.id, id)).returning();
    return result[0];
  }
  
  async deleteTeacher(id: number): Promise<boolean> {
    try {
      // İlgili kayıtları temizle
      await db.delete(schedules).where(eq(schedules.teacherId, id));
      await db.delete(duties).where(eq(duties.teacherId, id));
      await db.delete(absences).where(eq(absences.teacherId, id));
      await db.delete(substitutions).where(eq(substitutions.substituteTeacherId, id));
      await db.delete(substitutions).where(eq(substitutions.absentTeacherId, id));
      await db.delete(extraLessons).where(eq(extraLessons.teacherId, id));
      
      // Öğretmeni sil
      const result = await db.delete(teachers).where(eq(teachers.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Delete teacher error:", error);
      return false;
    }
  }
  
  // Subject Methods
  async getAllSubjects(): Promise<Subject[]> {
    return await db.select().from(subjects);
  }
  
  async getSubject(id: number): Promise<Subject | undefined> {
    const result = await db.select().from(subjects).where(eq(subjects.id, id));
    return result[0];
  }
  
  async createSubject(subject: InsertSubject): Promise<Subject> {
    const result = await db.insert(subjects).values(subject).returning();
    return result[0];
  }
  
  async updateSubject(id: number, subjectData: Partial<InsertSubject>): Promise<Subject | undefined> {
    const result = await db.update(subjects).set(subjectData).where(eq(subjects.id, id)).returning();
    return result[0];
  }
  
  async deleteSubject(id: number): Promise<boolean> {
    try {
      // İlgili kayıtları temizle
      await db.delete(schedules).where(eq(schedules.subjectId, id));
      
      // Branşı sil
      const result = await db.delete(subjects).where(eq(subjects.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Delete subject error:", error);
      return false;
    }
  }
  
  // Class Methods
  async getAllClasses(): Promise<Class[]> {
    return await db.select().from(classes);
  }
  
  async getClass(id: number): Promise<Class | undefined> {
    const result = await db.select().from(classes).where(eq(classes.id, id));
    return result[0];
  }
  
  async createClass(classObj: InsertClass): Promise<Class> {
    const result = await db.insert(classes).values(classObj).returning();
    return result[0];
  }
  
  async updateClass(id: number, classData: Partial<InsertClass>): Promise<Class | undefined> {
    const result = await db.update(classes).set(classData).where(eq(classes.id, id)).returning();
    return result[0];
  }
  
  async deleteClass(id: number): Promise<boolean> {
    try {
      // İlgili kayıtları temizle
      await db.delete(schedules).where(eq(schedules.classId, id));
      
      // Sınıfı sil
      const result = await db.delete(classes).where(eq(classes.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Delete class error:", error);
      return false;
    }
  }
  
  // Period Methods
  async getAllPeriods(): Promise<Period[]> {
    return await db.select().from(periods).orderBy(asc(periods.order));
  }
  
  async getPeriod(id: number): Promise<Period | undefined> {
    const result = await db.select().from(periods).where(eq(periods.id, id));
    return result[0];
  }
  
  async createPeriod(period: InsertPeriod): Promise<Period> {
    const result = await db.insert(periods).values(period).returning();
    return result[0];
  }
  
  async updatePeriod(id: number, periodData: Partial<InsertPeriod>): Promise<Period | undefined> {
    const result = await db.update(periods).set(periodData).where(eq(periods.id, id)).returning();
    return result[0];
  }
  
  async deletePeriod(id: number): Promise<boolean> {
    try {
      // İlgili kayıtları temizle
      await db.delete(schedules).where(eq(schedules.periodId, id));
      
      // Dönem/saati sil
      const result = await db.delete(periods).where(eq(periods.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Delete period error:", error);
      return false;
    }
  }
  
  // Schedule Methods
  async getAllSchedules(): Promise<Schedule[]> {
    return await db.select().from(schedules);
  }
  
  async getSchedule(id: number): Promise<Schedule | undefined> {
    const result = await db.select().from(schedules).where(eq(schedules.id, id));
    return result[0];
  }
  
  async createSchedule(schedule: InsertSchedule): Promise<Schedule> {
    const result = await db.insert(schedules).values(schedule).returning();
    return result[0];
  }
  
  async updateSchedule(id: number, scheduleData: Partial<InsertSchedule>): Promise<Schedule | undefined> {
    const result = await db.update(schedules).set(scheduleData).where(eq(schedules.id, id)).returning();
    return result[0];
  }
  
  async deleteSchedule(id: number): Promise<boolean> {
    try {
      // İlgili kayıtları temizle
      await db.delete(substitutions).where(eq(substitutions.scheduleId, id));
      
      // Programı sil
      const result = await db.delete(schedules).where(eq(schedules.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Delete schedule error:", error);
      return false;
    }
  }
  
  async getSchedulesByTeacher(teacherId: number): Promise<Schedule[]> {
    return await db
      .select()
      .from(schedules)
      .where(eq(schedules.teacherId, teacherId))
      .orderBy(asc(schedules.dayOfWeek), asc(schedules.periodId));
  }
  
  async getSchedulesByClass(classId: number): Promise<Schedule[]> {
    return await db
      .select()
      .from(schedules)
      .where(eq(schedules.classId, classId))
      .orderBy(asc(schedules.dayOfWeek), asc(schedules.periodId));
  }
  
  async getSchedulesByDay(dayOfWeek: number): Promise<Schedule[]> {
    return await db
      .select()
      .from(schedules)
      .where(eq(schedules.dayOfWeek, dayOfWeek))
      .orderBy(asc(schedules.periodId));
  }
  
  // Duty Location Methods
  async getAllDutyLocations(): Promise<DutyLocation[]> {
    return await db.select().from(dutyLocations);
  }
  
  async getDutyLocation(id: number): Promise<DutyLocation | undefined> {
    const result = await db.select().from(dutyLocations).where(eq(dutyLocations.id, id));
    return result[0];
  }
  
  async createDutyLocation(location: InsertDutyLocation): Promise<DutyLocation> {
    const result = await db.insert(dutyLocations).values(location).returning();
    return result[0];
  }
  
  async updateDutyLocation(id: number, locationData: Partial<InsertDutyLocation>): Promise<DutyLocation | undefined> {
    const result = await db.update(dutyLocations).set(locationData).where(eq(dutyLocations.id, id)).returning();
    return result[0];
  }
  
  async deleteDutyLocation(id: number): Promise<boolean> {
    try {
      // İlgili kayıtları temizle
      await db.delete(duties).where(eq(duties.locationId, id));
      
      // Görev yerini sil
      const result = await db.delete(dutyLocations).where(eq(dutyLocations.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Delete duty location error:", error);
      return false;
    }
  }
  
  // Duty Methods
  async getAllDuties(): Promise<Duty[]> {
    return await db.select().from(duties);
  }
  
  async getDuty(id: number): Promise<Duty | undefined> {
    const result = await db.select().from(duties).where(eq(duties.id, id));
    return result[0];
  }
  
  async createDuty(duty: InsertDuty): Promise<Duty> {
    const result = await db.insert(duties).values({
      teacherId: duty.teacherId,
      locationId: duty.locationId,
      dayOfWeek: duty.dayOfWeek,
      periodId: duty.periodId || null,
      dutyType: duty.dutyType || null,
      notes: duty.notes || null,
    }).returning();
    return result[0];
  }
  
  async updateDuty(id: number, dutyData: Partial<InsertDuty>): Promise<Duty | undefined> {
    const result = await db.update(duties).set(dutyData).where(eq(duties.id, id)).returning();
    return result[0];
  }
  
  async deleteDuty(id: number): Promise<boolean> {
    const result = await db.delete(duties).where(eq(duties.id, id));
    return result.rowCount > 0;
  }
  
  async getDutiesByTeacher(teacherId: number): Promise<Duty[]> {
    return await db
      .select()
      .from(duties)
      .where(eq(duties.teacherId, teacherId))
      .orderBy(asc(duties.dayOfWeek));
  }
  
  async getDutiesByLocation(locationId: number): Promise<Duty[]> {
    return await db
      .select()
      .from(duties)
      .where(eq(duties.locationId, locationId))
      .orderBy(asc(duties.dayOfWeek));
  }
  
  async getDutiesByDay(dayOfWeek: number): Promise<Duty[]> {
    return await db
      .select()
      .from(duties)
      .where(eq(duties.dayOfWeek, dayOfWeek));
  }
  
  // Absence Methods
  async getAllAbsences(): Promise<Absence[]> {
    return await db.select().from(absences);
  }
  
  async getAbsence(id: number): Promise<Absence | undefined> {
    const result = await db.select().from(absences).where(eq(absences.id, id));
    return result[0];
  }
  
  async createAbsence(absence: InsertAbsence): Promise<Absence> {
    const result = await db.insert(absences).values({
      teacherId: absence.teacherId,
      startDate: absence.startDate,
      endDate: absence.endDate,
      reason: absence.reason || null,
    }).returning();
    return result[0];
  }
  
  async updateAbsence(id: number, absenceData: Partial<InsertAbsence>): Promise<Absence | undefined> {
    const result = await db.update(absences).set(absenceData).where(eq(absences.id, id)).returning();
    return result[0];
  }
  
  async deleteAbsence(id: number): Promise<boolean> {
    const result = await db.delete(absences).where(eq(absences.id, id));
    return result.rowCount > 0;
  }
  
  async getAbsencesByTeacher(teacherId: number): Promise<Absence[]> {
    return await db
      .select()
      .from(absences)
      .where(eq(absences.teacherId, teacherId))
      .orderBy(desc(absences.startDate));
  }
  
  async getAbsencesByDate(date: Date): Promise<Absence[]> {
    return await db
      .select()
      .from(absences)
      .where(
        and(
          sql`${absences.startDate} <= ${date}`,
          sql`${absences.endDate} >= ${date}`
        )
      );
  }
  
  async getActiveAbsences(date: Date): Promise<Absence[]> {
    return await db
      .select()
      .from(absences)
      .where(
        and(
          sql`${absences.startDate} <= ${date}`,
          sql`${absences.endDate} >= ${date}`
        )
      );
  }
  
  // Substitution Methods
  async getAllSubstitutions(): Promise<Substitution[]> {
    return await db.select().from(substitutions);
  }
  
  async getSubstitution(id: number): Promise<Substitution | undefined> {
    const result = await db.select().from(substitutions).where(eq(substitutions.id, id));
    return result[0];
  }
  
  async createSubstitution(substitution: InsertSubstitution): Promise<Substitution> {
    const result = await db.insert(substitutions).values(substitution).returning();
    return result[0];
  }
  
  async updateSubstitution(id: number, substitutionData: Partial<InsertSubstitution>): Promise<Substitution | undefined> {
    const result = await db.update(substitutions).set(substitutionData).where(eq(substitutions.id, id)).returning();
    return result[0];
  }
  
  async deleteSubstitution(id: number): Promise<boolean> {
    const result = await db.delete(substitutions).where(eq(substitutions.id, id));
    return result.rowCount > 0;
  }
  
  async getSubstitutionsByTeacher(teacherId: number): Promise<Substitution[]> {
    return await db
      .select()
      .from(substitutions)
      .where(
        sql`${substitutions.substituteTeacherId} = ${teacherId} OR ${substitutions.absentTeacherId} = ${teacherId}`
      )
      .orderBy(desc(substitutions.date));
  }
  
  async getSubstitutionsByDate(date: Date): Promise<Substitution[]> {
    return await db
      .select()
      .from(substitutions)
      .where(eq(substitutions.date, date));
  }
  
  // Extra Lesson Methods
  async getAllExtraLessons(): Promise<ExtraLesson[]> {
    return await db.select().from(extraLessons);
  }
  
  async getExtraLesson(id: number): Promise<ExtraLesson | undefined> {
    const result = await db.select().from(extraLessons).where(eq(extraLessons.id, id));
    return result[0];
  }
  
  async createExtraLesson(extraLesson: InsertExtraLesson): Promise<ExtraLesson> {
    const result = await db.insert(extraLessons).values({
      teacherId: extraLesson.teacherId,
      type: extraLesson.type,
      month: extraLesson.month,
      year: extraLesson.year,
      count: extraLesson.count,
      notes: extraLesson.notes || null,
    }).returning();
    return result[0];
  }
  
  async updateExtraLesson(id: number, extraLessonData: Partial<InsertExtraLesson>): Promise<ExtraLesson | undefined> {
    const result = await db.update(extraLessons).set(extraLessonData).where(eq(extraLessons.id, id)).returning();
    return result[0];
  }
  
  async deleteExtraLesson(id: number): Promise<boolean> {
    const result = await db.delete(extraLessons).where(eq(extraLessons.id, id));
    return result.rowCount > 0;
  }
  
  async getExtraLessonsByTeacher(teacherId: number): Promise<ExtraLesson[]> {
    return await db
      .select()
      .from(extraLessons)
      .where(eq(extraLessons.teacherId, teacherId))
      .orderBy(desc(extraLessons.year), desc(extraLessons.month));
  }
  
  async getExtraLessonsByMonth(month: number, year: number): Promise<ExtraLesson[]> {
    return await db
      .select()
      .from(extraLessons)
      .where(
        and(
          eq(extraLessons.month, month),
          eq(extraLessons.year, year)
        )
      );
  }
  
  async getExtraLessonsReport(month: number, year: number, type?: string): Promise<any[]> {
    // Temel sorgu
    let query = db
      .select({
        teacherId: extraLessons.teacherId,
        totalCount: sql`SUM(${extraLessons.count})`.mapWith(Number)
      })
      .from(extraLessons)
      .where(
        and(
          eq(extraLessons.month, month),
          eq(extraLessons.year, year)
        )
      )
      .groupBy(extraLessons.teacherId);
    
    // Eğer tip belirtilmişse, sorguya ekle
    if (type) {
      query = query.where(eq(extraLessons.type, type));
    }
    
    // Sorguyu çalıştır
    const results = await query;
    
    // Öğretmen bilgilerini ekleyelim
    const reportWithTeachers = await Promise.all(
      results.map(async (result) => {
        const teacher = await this.getTeacher(result.teacherId);
        return {
          ...result,
          teacher: teacher ? {
            id: teacher.id,
            name: teacher.name,
            surname: teacher.surname,
            fullName: `${teacher.name} ${teacher.surname}`,
            branch: teacher.branch
          } : null
        };
      })
    );
    
    return reportWithTeachers;
  }
  
  // Student management
  async getAllStudents(): Promise<Student[]> {
    return await db.select().from(students).orderBy(asc(students.lastName), asc(students.firstName));
  }
  
  async getStudent(id: number): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student || undefined;
  }
  
  async createStudent(insertData: InsertStudent): Promise<Student> {
    const [student] = await db.insert(students).values(insertData).returning();
    return student;
  }
  
  async updateStudent(id: number, updateData: Partial<InsertStudent>): Promise<Student | undefined> {
    const [student] = await db
      .update(students)
      .set(updateData)
      .where(eq(students.id, id))
      .returning();
    return student || undefined;
  }
  
  async deleteStudent(id: number): Promise<boolean> {
    try {
      // İlgili kurs ve yoklama verilerini temizle
      await db
        .delete(homeworkAttendance)
        .where(eq(homeworkAttendance.studentId, id));
        
      await db
        .delete(studentCourses)
        .where(eq(studentCourses.studentId, id));
      
      // Öğrenciyi sil
      const result = await db.delete(students).where(eq(students.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Öğrenci silme hatası:", error);
      return false;
    }
  }
  
  // Student Course management
  async getAllStudentCourses(): Promise<StudentCourse[]> {
    return await db.select().from(studentCourses);
  }
  
  async getStudentCoursesForStudent(studentId: number): Promise<StudentCourse[]> {
    return await db
      .select()
      .from(studentCourses)
      .where(eq(studentCourses.studentId, studentId));
  }
  
  async getStudentCourse(id: number): Promise<StudentCourse | undefined> {
    const [course] = await db
      .select()
      .from(studentCourses)
      .where(eq(studentCourses.id, id));
    return course || undefined;
  }
  
  async createStudentCourse(course: InsertStudentCourse): Promise<StudentCourse> {
    const [result] = await db
      .insert(studentCourses)
      .values(course)
      .returning();
    return result;
  }
  
  async updateStudentCourse(id: number, course: Partial<InsertStudentCourse>): Promise<StudentCourse | undefined> {
    const [result] = await db
      .update(studentCourses)
      .set(course)
      .where(eq(studentCourses.id, id))
      .returning();
    return result || undefined;
  }
  
  async deleteStudentCourse(id: number): Promise<boolean> {
    try {
      const result = await db.delete(studentCourses).where(eq(studentCourses.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Öğrenci kursu silme hatası:", error);
      return false;
    }
  }
  
  // Homework Session management
  async getAllHomeworkSessions(): Promise<HomeworkSession[]> {
    return await db
      .select()
      .from(homeworkSessions)
      .orderBy(desc(homeworkSessions.dayOfWeek), asc(homeworkSessions.startTime));
  }
  
  async getHomeworkSession(id: number): Promise<HomeworkSession | undefined> {
    const [session] = await db
      .select()
      .from(homeworkSessions)
      .where(eq(homeworkSessions.id, id));
    return session || undefined;
  }
  
  async createHomeworkSession(session: InsertHomeworkSession): Promise<HomeworkSession> {
    const [result] = await db
      .insert(homeworkSessions)
      .values(session)
      .returning();
    return result;
  }
  
  async updateHomeworkSession(id: number, session: Partial<InsertHomeworkSession>): Promise<HomeworkSession | undefined> {
    const [result] = await db
      .update(homeworkSessions)
      .set(session)
      .where(eq(homeworkSessions.id, id))
      .returning();
    return result || undefined;
  }
  
  async deleteHomeworkSession(id: number): Promise<boolean> {
    try {
      // İlgili yoklama verilerini de sil
      await db
        .delete(homeworkAttendance)
        .where(eq(homeworkAttendance.sessionId, id));
        
      // Etüt oturumunu sil
      const result = await db.delete(homeworkSessions).where(eq(homeworkSessions.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Etüt oturumu silme hatası:", error);
      return false;
    }
  }
  
  // Homework Attendance management
  async getAllHomeworkAttendance(): Promise<HomeworkAttendance[]> {
    return await db.select().from(homeworkAttendance);
  }
  
  async getHomeworkAttendanceByDate(date: string): Promise<HomeworkAttendance[]> {
    return await db
      .select()
      .from(homeworkAttendance)
      .where(eq(homeworkAttendance.date, date));
  }
  
  async getHomeworkAttendanceByStudent(studentId: number): Promise<HomeworkAttendance[]> {
    return await db
      .select()
      .from(homeworkAttendance)
      .where(eq(homeworkAttendance.studentId, studentId));
  }
  
  async getHomeworkAttendance(id: number): Promise<HomeworkAttendance | undefined> {
    const [attendance] = await db
      .select()
      .from(homeworkAttendance)
      .where(eq(homeworkAttendance.id, id));
    return attendance || undefined;
  }
  
  async createHomeworkAttendance(attendance: InsertHomeworkAttendance): Promise<HomeworkAttendance> {
    const [result] = await db
      .insert(homeworkAttendance)
      .values(attendance)
      .returning();
    return result;
  }
  
  async updateHomeworkAttendance(id: number, attendance: Partial<InsertHomeworkAttendance>): Promise<HomeworkAttendance | undefined> {
    const [result] = await db
      .update(homeworkAttendance)
      .set(attendance)
      .where(eq(homeworkAttendance.id, id))
      .returning();
    return result || undefined;
  }
  
  async deleteHomeworkAttendance(id: number): Promise<boolean> {
    try {
      const result = await db.delete(homeworkAttendance).where(eq(homeworkAttendance.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Yoklama kaydı silme hatası:", error);
      return false;
    }
  }
  
  async batchCreateOrUpdateHomeworkAttendance(records: InsertHomeworkAttendance[]): Promise<{ created: number, updated: number }> {
    let created = 0;
    let updated = 0;
    
    for (const record of records) {
      // Aynı oturum ve öğrenci için yoklama var mı kontrol et
      const [existing] = await db
        .select()
        .from(homeworkAttendance)
        .where(and(
          eq(homeworkAttendance.sessionId, record.sessionId),
          eq(homeworkAttendance.studentId, record.studentId)
        ));
      
      if (existing) {
        // Güncelle
        await db
          .update(homeworkAttendance)
          .set({
            status: record.status, 
            notes: record.notes
          })
          .where(eq(homeworkAttendance.id, existing.id));
        updated++;
      } else {
        // Yeni ekle
        await db.insert(homeworkAttendance).values(record);
        created++;
      }
    }
    
    return { created, updated };
  }
}

// Export database storage instance
export const storage = new DatabaseStorage();