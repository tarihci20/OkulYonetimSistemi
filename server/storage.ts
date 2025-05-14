import { users, teachers, subjects, classes, periods, schedules, dutyLocations, duties, absences, substitutions, extraLessons } from "@shared/schema";
import type { User, Teacher, Subject, Class, Period, Schedule, DutyLocation, Duty, Absence, Substitution, ExtraLesson } from "@shared/schema";
import type { InsertUser, InsertTeacher, InsertSubject, InsertClass, InsertPeriod, InsertSchedule, InsertDutyLocation, InsertDuty, InsertAbsence, InsertSubstitution, InsertExtraLesson } from "@shared/schema";
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
  createUser(user: InsertUser): Promise<User>;
  updateUserLastLogin(id: number): Promise<User | undefined>;
  
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
  getSchedulesByTeacher(teacherId: number): Promise<Schedule[]>;
  getSchedulesByClass(classId: number): Promise<Schedule[]>;
  getSchedulesByDay(dayOfWeek: number): Promise<Schedule[]>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  updateSchedule(id: number, schedule: Partial<InsertSchedule>): Promise<Schedule | undefined>;
  deleteSchedule(id: number): Promise<boolean>;
  
  // Duty location management
  getAllDutyLocations(): Promise<DutyLocation[]>;
  getDutyLocation(id: number): Promise<DutyLocation | undefined>;
  createDutyLocation(location: InsertDutyLocation): Promise<DutyLocation>;
  updateDutyLocation(id: number, location: Partial<InsertDutyLocation>): Promise<DutyLocation | undefined>;
  deleteDutyLocation(id: number): Promise<boolean>;
  
  // Duty management
  getAllDuties(): Promise<Duty[]>;
  getDutiesByTeacher(teacherId: number): Promise<Duty[]>;
  getDutiesByDay(dayOfWeek: number): Promise<Duty[]>;
  createDuty(duty: InsertDuty): Promise<Duty>;
  updateDuty(id: number, duty: Partial<InsertDuty>): Promise<Duty | undefined>;
  deleteDuty(id: number): Promise<boolean>;
  
  // Absence management
  getAllAbsences(): Promise<Absence[]>;
  getAbsencesByTeacher(teacherId: number): Promise<Absence[]>;
  getAbsencesByDate(date: Date): Promise<Absence[]>;
  createAbsence(absence: InsertAbsence): Promise<Absence>;
  updateAbsence(id: number, absence: Partial<InsertAbsence>): Promise<Absence | undefined>;
  deleteAbsence(id: number): Promise<boolean>;
  
  // Substitution management
  getAllSubstitutions(): Promise<Substitution[]>;
  getSubstitutionsByDate(date: Date): Promise<Substitution[]>;
  getSubstitutionsByTeacher(teacherId: number): Promise<Substitution[]>;
  getSubstitutionsBySubstituteTeacher(substituteTeacherId: number): Promise<Substitution[]>;
  createSubstitution(substitution: InsertSubstitution): Promise<Substitution>;
  updateSubstitution(id: number, substitution: Partial<InsertSubstitution>): Promise<Substitution | undefined>;
  deleteSubstitution(id: number): Promise<boolean>;
  
  // Extra lesson management
  getAllExtraLessons(): Promise<ExtraLesson[]>;
  getExtraLessonsByTeacher(teacherId: number): Promise<ExtraLesson[]>;
  getExtraLessonsByMonthYear(month: number, year: number): Promise<ExtraLesson[]>;
  createExtraLesson(extraLesson: InsertExtraLesson): Promise<ExtraLesson>;
  updateExtraLesson(id: number, extraLesson: Partial<InsertExtraLesson>): Promise<ExtraLesson | undefined>;
  deleteExtraLesson(id: number): Promise<boolean>;
  
  // Session store for authentication
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private usersData: Map<number, User>;
  private teachersData: Map<number, Teacher>;
  private subjectsData: Map<number, Subject>;
  private classesData: Map<number, Class>;
  private periodsData: Map<number, Period>;
  private schedulesData: Map<number, Schedule>;
  private dutyLocationsData: Map<number, DutyLocation>;
  private dutiesData: Map<number, Duty>;
  private absencesData: Map<number, Absence>;
  private substitutionsData: Map<number, Substitution>;
  private extraLessonsData: Map<number, ExtraLesson>;
  
  private userIdCounter: number;
  private teacherIdCounter: number;
  private subjectIdCounter: number;
  private classIdCounter: number;
  private periodIdCounter: number;
  private scheduleIdCounter: number;
  private dutyLocationIdCounter: number;
  private dutyIdCounter: number;
  private absenceIdCounter: number;
  private substitutionIdCounter: number;
  private extraLessonIdCounter: number;
  
  sessionStore: session.Store;
  
  constructor() {
    this.usersData = new Map();
    this.teachersData = new Map();
    this.subjectsData = new Map();
    this.classesData = new Map();
    this.periodsData = new Map();
    this.schedulesData = new Map();
    this.dutyLocationsData = new Map();
    this.dutiesData = new Map();
    this.absencesData = new Map();
    this.substitutionsData = new Map();
    this.extraLessonsData = new Map();
    
    this.userIdCounter = 1;
    this.teacherIdCounter = 1;
    this.subjectIdCounter = 1;
    this.classIdCounter = 1;
    this.periodIdCounter = 1;
    this.scheduleIdCounter = 1;
    this.dutyLocationIdCounter = 1;
    this.dutyIdCounter = 1;
    this.absenceIdCounter = 1;
    this.substitutionIdCounter = 1;
    this.extraLessonIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24h
    });
    
    // Initialize with default admin user
    this.createUser({
      username: "tarihci20",
      password: "aci2406717", // This will be hashed in auth.ts before storage
      isAdmin: true,
      fullName: "Yönetici",
    });
    
    // Initialize with sample data
    this.initializeSampleData();
  }
  
  // Initialize sample data for development
  private initializeSampleData() {
    // Sample periods (ders saatleri)
    const periods = [
      { order: 1, startTime: "08:30", endTime: "09:10" },
      { order: 2, startTime: "09:20", endTime: "10:00" },
      { order: 3, startTime: "10:10", endTime: "10:50" },
      { order: 4, startTime: "11:20", endTime: "12:00" },
      { order: 5, startTime: "12:10", endTime: "12:50" },
      { order: 6, startTime: "13:40", endTime: "14:20" },
      { order: 7, startTime: "14:30", endTime: "15:10" },
      { order: 8, startTime: "15:20", endTime: "16:00" }
    ];
    
    periods.forEach(period => {
      this.createPeriod(period);
    });
    
    // Sample subjects (dersler)
    const subjects = [
      { name: "Türk Dili ve Edebiyatı" },
      { name: "Matematik" },
      { name: "Fizik" },
      { name: "Kimya" },
      { name: "Biyoloji" },
      { name: "Tarih" },
      { name: "Coğrafya" },
      { name: "İngilizce" },
      { name: "Sosyal Bilgiler" }
    ];
    
    subjects.forEach(subject => {
      this.createSubject(subject);
    });
    
    // Sample duty locations (nöbet yerleri)
    const dutyLocations = [
      { name: "A Blok - 1. Kat" },
      { name: "A Blok - 2. Kat" },
      { name: "B Blok - Giriş" },
      { name: "B Blok - 1. Kat" },
      { name: "Kantin" }
    ];
    
    dutyLocations.forEach(location => {
      this.createDutyLocation(location);
    });
    
    // Sample classes (sınıflar)
    const classes = [
      { name: "9/A" },
      { name: "9/B" },
      { name: "9/C" },
      { name: "10/A" },
      { name: "10/B" },
      { name: "10/C" },
      { name: "10/D" },
      { name: "11/A" },
      { name: "11/B" },
      { name: "12/A" }
    ];
    
    classes.forEach(cls => {
      this.createClass(cls);
    });
    
    // Sample teachers (öğretmenler)
    const teachers = [
      { name: "Canan", surname: "Aksoy", branch: "Türk Dili ve Edebiyatı" },
      { name: "Ebru", surname: "Çelik", branch: "Türk Dili ve Edebiyatı" },
      { name: "Murat", surname: "Yıldırım", branch: "Biyoloji" },
      { name: "Ayşe", surname: "Yılmaz", branch: "Matematik" },
      { name: "Mehmet", surname: "Kaya", branch: "Tarih" },
      { name: "Ali", surname: "Öztürk", branch: "Fizik" },
      { name: "Zeynep", surname: "Demir", branch: "Kimya" },
      { name: "Hakan", surname: "Şahin", branch: "İngilizce" },
      { name: "Fatma", surname: "Yıldız", branch: "Matematik" },
      { name: "Ahmet", surname: "Yalçın", branch: "Coğrafya" },
      { name: "Selim", surname: "Kandemir", branch: "Sosyal Bilgiler" },
      { name: "Mustafa", surname: "Koç", branch: "Sosyal Bilgiler" },
      { name: "Nihal", surname: "Tekin", branch: "Türk Dili ve Edebiyatı" },
      { name: "Kemal", surname: "Yücel", branch: "Türk Dili ve Edebiyatı" }
    ];
    
    teachers.forEach(teacher => {
      this.createTeacher(teacher);
    });
  }
  
  // User Methods
  async getUser(id: number): Promise<User | undefined> {
    return this.usersData.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersData.values()).find(
      (user) => user.username === username
    );
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = { ...user, id };
    this.usersData.set(id, newUser);
    return newUser;
  }
  
  async updateUserLastLogin(id: number): Promise<User | undefined> {
    const user = this.usersData.get(id);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      lastLogin: new Date() 
    };
    this.usersData.set(id, updatedUser);
    return updatedUser;
  }
  
  // Teacher Methods
  async getAllTeachers(): Promise<Teacher[]> {
    return Array.from(this.teachersData.values());
  }
  
  async getTeacher(id: number): Promise<Teacher | undefined> {
    return this.teachersData.get(id);
  }
  
  async createTeacher(teacher: InsertTeacher): Promise<Teacher> {
    const id = this.teacherIdCounter++;
    const newTeacher: Teacher = { ...teacher, id };
    this.teachersData.set(id, newTeacher);
    return newTeacher;
  }
  
  async updateTeacher(id: number, teacherData: Partial<InsertTeacher>): Promise<Teacher | undefined> {
    const teacher = this.teachersData.get(id);
    if (!teacher) return undefined;
    
    const updatedTeacher = { ...teacher, ...teacherData };
    this.teachersData.set(id, updatedTeacher);
    return updatedTeacher;
  }
  
  async deleteTeacher(id: number): Promise<boolean> {
    return this.teachersData.delete(id);
  }
  
  // Subject Methods
  async getAllSubjects(): Promise<Subject[]> {
    return Array.from(this.subjectsData.values());
  }
  
  async getSubject(id: number): Promise<Subject | undefined> {
    return this.subjectsData.get(id);
  }
  
  async createSubject(subject: InsertSubject): Promise<Subject> {
    const id = this.subjectIdCounter++;
    const newSubject: Subject = { ...subject, id };
    this.subjectsData.set(id, newSubject);
    return newSubject;
  }
  
  async updateSubject(id: number, subjectData: Partial<InsertSubject>): Promise<Subject | undefined> {
    const subject = this.subjectsData.get(id);
    if (!subject) return undefined;
    
    const updatedSubject = { ...subject, ...subjectData };
    this.subjectsData.set(id, updatedSubject);
    return updatedSubject;
  }
  
  async deleteSubject(id: number): Promise<boolean> {
    return this.subjectsData.delete(id);
  }
  
  // Class Methods
  async getAllClasses(): Promise<Class[]> {
    return Array.from(this.classesData.values());
  }
  
  async getClass(id: number): Promise<Class | undefined> {
    return this.classesData.get(id);
  }
  
  async createClass(classObj: InsertClass): Promise<Class> {
    const id = this.classIdCounter++;
    const newClass: Class = { ...classObj, id };
    this.classesData.set(id, newClass);
    return newClass;
  }
  
  async updateClass(id: number, classData: Partial<InsertClass>): Promise<Class | undefined> {
    const classObj = this.classesData.get(id);
    if (!classObj) return undefined;
    
    const updatedClass = { ...classObj, ...classData };
    this.classesData.set(id, updatedClass);
    return updatedClass;
  }
  
  async deleteClass(id: number): Promise<boolean> {
    return this.classesData.delete(id);
  }
  
  // Period Methods
  async getAllPeriods(): Promise<Period[]> {
    return Array.from(this.periodsData.values());
  }
  
  async getPeriod(id: number): Promise<Period | undefined> {
    return this.periodsData.get(id);
  }
  
  async createPeriod(period: InsertPeriod): Promise<Period> {
    const id = this.periodIdCounter++;
    const newPeriod: Period = { ...period, id };
    this.periodsData.set(id, newPeriod);
    return newPeriod;
  }
  
  async updatePeriod(id: number, periodData: Partial<InsertPeriod>): Promise<Period | undefined> {
    const period = this.periodsData.get(id);
    if (!period) return undefined;
    
    const updatedPeriod = { ...period, ...periodData };
    this.periodsData.set(id, updatedPeriod);
    return updatedPeriod;
  }
  
  async deletePeriod(id: number): Promise<boolean> {
    return this.periodsData.delete(id);
  }
  
  // Schedule Methods
  async getAllSchedules(): Promise<Schedule[]> {
    return Array.from(this.schedulesData.values());
  }
  
  async getSchedule(id: number): Promise<Schedule | undefined> {
    return this.schedulesData.get(id);
  }
  
  async getSchedulesByTeacher(teacherId: number): Promise<Schedule[]> {
    return Array.from(this.schedulesData.values()).filter(
      schedule => schedule.teacherId === teacherId
    );
  }
  
  async getSchedulesByClass(classId: number): Promise<Schedule[]> {
    return Array.from(this.schedulesData.values()).filter(
      schedule => schedule.classId === classId
    );
  }
  
  async getSchedulesByDay(dayOfWeek: number): Promise<Schedule[]> {
    return Array.from(this.schedulesData.values()).filter(
      schedule => schedule.dayOfWeek === dayOfWeek
    );
  }
  
  async createSchedule(schedule: InsertSchedule): Promise<Schedule> {
    const id = this.scheduleIdCounter++;
    const newSchedule: Schedule = { ...schedule, id };
    this.schedulesData.set(id, newSchedule);
    return newSchedule;
  }
  
  async updateSchedule(id: number, scheduleData: Partial<InsertSchedule>): Promise<Schedule | undefined> {
    const schedule = this.schedulesData.get(id);
    if (!schedule) return undefined;
    
    const updatedSchedule = { ...schedule, ...scheduleData };
    this.schedulesData.set(id, updatedSchedule);
    return updatedSchedule;
  }
  
  async deleteSchedule(id: number): Promise<boolean> {
    return this.schedulesData.delete(id);
  }
  
  // Duty Location Methods
  async getAllDutyLocations(): Promise<DutyLocation[]> {
    return Array.from(this.dutyLocationsData.values());
  }
  
  async getDutyLocation(id: number): Promise<DutyLocation | undefined> {
    return this.dutyLocationsData.get(id);
  }
  
  async createDutyLocation(location: InsertDutyLocation): Promise<DutyLocation> {
    const id = this.dutyLocationIdCounter++;
    const newLocation: DutyLocation = { ...location, id };
    this.dutyLocationsData.set(id, newLocation);
    return newLocation;
  }
  
  async updateDutyLocation(id: number, locationData: Partial<InsertDutyLocation>): Promise<DutyLocation | undefined> {
    const location = this.dutyLocationsData.get(id);
    if (!location) return undefined;
    
    const updatedLocation = { ...location, ...locationData };
    this.dutyLocationsData.set(id, updatedLocation);
    return updatedLocation;
  }
  
  async deleteDutyLocation(id: number): Promise<boolean> {
    return this.dutyLocationsData.delete(id);
  }
  
  // Duty Methods
  async getAllDuties(): Promise<Duty[]> {
    return Array.from(this.dutiesData.values());
  }
  
  async getDutiesByTeacher(teacherId: number): Promise<Duty[]> {
    return Array.from(this.dutiesData.values()).filter(
      duty => duty.teacherId === teacherId
    );
  }
  
  async getDutiesByDay(dayOfWeek: number): Promise<Duty[]> {
    return Array.from(this.dutiesData.values()).filter(
      duty => duty.dayOfWeek === dayOfWeek
    );
  }
  
  async createDuty(duty: InsertDuty): Promise<Duty> {
    const id = this.dutyIdCounter++;
    const newDuty: Duty = { ...duty, id };
    this.dutiesData.set(id, newDuty);
    return newDuty;
  }
  
  async updateDuty(id: number, dutyData: Partial<InsertDuty>): Promise<Duty | undefined> {
    const duty = this.dutiesData.get(id);
    if (!duty) return undefined;
    
    const updatedDuty = { ...duty, ...dutyData };
    this.dutiesData.set(id, updatedDuty);
    return updatedDuty;
  }
  
  async deleteDuty(id: number): Promise<boolean> {
    return this.dutiesData.delete(id);
  }
  
  // Absence Methods
  async getAllAbsences(): Promise<Absence[]> {
    return Array.from(this.absencesData.values());
  }
  
  async getAbsencesByTeacher(teacherId: number): Promise<Absence[]> {
    return Array.from(this.absencesData.values()).filter(
      absence => absence.teacherId === teacherId
    );
  }
  
  async getAbsencesByDate(date: Date): Promise<Absence[]> {
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);
    
    return Array.from(this.absencesData.values()).filter(absence => {
      const startDate = new Date(absence.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(absence.endDate);
      endDate.setHours(23, 59, 59, 999);
      
      return dateToCheck >= startDate && dateToCheck <= endDate;
    });
  }
  
  async createAbsence(absence: InsertAbsence): Promise<Absence> {
    const id = this.absenceIdCounter++;
    const newAbsence: Absence = { ...absence, id };
    this.absencesData.set(id, newAbsence);
    return newAbsence;
  }
  
  async updateAbsence(id: number, absenceData: Partial<InsertAbsence>): Promise<Absence | undefined> {
    const absence = this.absencesData.get(id);
    if (!absence) return undefined;
    
    const updatedAbsence = { ...absence, ...absenceData };
    this.absencesData.set(id, updatedAbsence);
    return updatedAbsence;
  }
  
  async deleteAbsence(id: number): Promise<boolean> {
    return this.absencesData.delete(id);
  }
  
  // Substitution Methods
  async getAllSubstitutions(): Promise<Substitution[]> {
    return Array.from(this.substitutionsData.values());
  }
  
  async getSubstitutionsByDate(date: Date): Promise<Substitution[]> {
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);
    
    return Array.from(this.substitutionsData.values()).filter(substitution => {
      const subDate = new Date(substitution.date);
      subDate.setHours(0, 0, 0, 0);
      
      return dateToCheck.getTime() === subDate.getTime();
    });
  }
  
  async getSubstitutionsByTeacher(teacherId: number): Promise<Substitution[]> {
    return Array.from(this.substitutionsData.values()).filter(
      substitution => substitution.absentTeacherId === teacherId
    );
  }
  
  async getSubstitutionsBySubstituteTeacher(substituteTeacherId: number): Promise<Substitution[]> {
    return Array.from(this.substitutionsData.values()).filter(
      substitution => substitution.substituteTeacherId === substituteTeacherId
    );
  }
  
  async createSubstitution(substitution: InsertSubstitution): Promise<Substitution> {
    const id = this.substitutionIdCounter++;
    const newSubstitution: Substitution = { ...substitution, id };
    this.substitutionsData.set(id, newSubstitution);
    
    // Create corresponding extra lesson records
    await this.createExtraLesson({
      teacherId: substitution.substituteTeacherId,
      count: 1,
      month: new Date(substitution.date).getMonth() + 1, // Month is 0-indexed
      year: new Date(substitution.date).getFullYear(),
      type: "substitution",
      notes: `Yerine görevlendirme: ${new Date(substitution.date).toLocaleDateString('tr-TR')}`,
    });
    
    await this.createExtraLesson({
      teacherId: substitution.absentTeacherId,
      count: -1,
      month: new Date(substitution.date).getMonth() + 1,
      year: new Date(substitution.date).getFullYear(),
      type: "substitution",
      notes: `İzin nedeniyle kesinti: ${new Date(substitution.date).toLocaleDateString('tr-TR')}`,
    });
    
    return newSubstitution;
  }
  
  async updateSubstitution(id: number, substitutionData: Partial<InsertSubstitution>): Promise<Substitution | undefined> {
    const substitution = this.substitutionsData.get(id);
    if (!substitution) return undefined;
    
    const updatedSubstitution = { ...substitution, ...substitutionData };
    this.substitutionsData.set(id, updatedSubstitution);
    return updatedSubstitution;
  }
  
  async deleteSubstitution(id: number): Promise<boolean> {
    return this.substitutionsData.delete(id);
  }
  
  // Extra Lesson Methods
  async getAllExtraLessons(): Promise<ExtraLesson[]> {
    return Array.from(this.extraLessonsData.values());
  }
  
  async getExtraLessonsByTeacher(teacherId: number): Promise<ExtraLesson[]> {
    return Array.from(this.extraLessonsData.values()).filter(
      extraLesson => extraLesson.teacherId === teacherId
    );
  }
  
  async getExtraLessonsByMonthYear(month: number, year: number): Promise<ExtraLesson[]> {
    return Array.from(this.extraLessonsData.values()).filter(
      extraLesson => extraLesson.month === month && extraLesson.year === year
    );
  }
  
  async createExtraLesson(extraLesson: InsertExtraLesson): Promise<ExtraLesson> {
    const id = this.extraLessonIdCounter++;
    const newExtraLesson: ExtraLesson = { ...extraLesson, id };
    this.extraLessonsData.set(id, newExtraLesson);
    return newExtraLesson;
  }
  
  async updateExtraLesson(id: number, extraLessonData: Partial<InsertExtraLesson>): Promise<ExtraLesson | undefined> {
    const extraLesson = this.extraLessonsData.get(id);
    if (!extraLesson) return undefined;
    
    const updatedExtraLesson = { ...extraLesson, ...extraLessonData };
    this.extraLessonsData.set(id, updatedExtraLesson);
    return updatedExtraLesson;
  }
  
  async deleteExtraLesson(id: number): Promise<boolean> {
    return this.extraLessonsData.delete(id);
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
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
  
  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
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
  
  // Teacher Methods
  async getAllTeachers(): Promise<Teacher[]> {
    const teachersList = await db.select().from(teachers);
    return teachersList.map(teacher => ({
      ...teacher,
      fullName: `${teacher.name} ${teacher.surname}`
    }));
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
    const result = await db
      .update(teachers)
      .set(teacherData)
      .where(eq(teachers.id, id))
      .returning();
    return result[0];
  }
  
  async deleteTeacher(id: number): Promise<boolean> {
    const result = await db.delete(teachers).where(eq(teachers.id, id));
    return result.count > 0;
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
    const result = await db
      .update(subjects)
      .set(subjectData)
      .where(eq(subjects.id, id))
      .returning();
    return result[0];
  }
  
  async deleteSubject(id: number): Promise<boolean> {
    const result = await db.delete(subjects).where(eq(subjects.id, id));
    return result.count > 0;
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
    const result = await db
      .update(classes)
      .set(classData)
      .where(eq(classes.id, id))
      .returning();
    return result[0];
  }
  
  async deleteClass(id: number): Promise<boolean> {
    const result = await db.delete(classes).where(eq(classes.id, id));
    return result.count > 0;
  }
  
  // Period Methods
  async getAllPeriods(): Promise<Period[]> {
    return await db.select().from(periods);
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
    const result = await db
      .update(periods)
      .set(periodData)
      .where(eq(periods.id, id))
      .returning();
    return result[0];
  }
  
  async deletePeriod(id: number): Promise<boolean> {
    try {
      // Önce period var mı kontrol et
      const period = await this.getPeriod(id);
      if (!period) {
        return false;
      }
      
      // Varsa sil
      const result = await db.delete(periods).where(eq(periods.id, id));
      return result.count > 0;
    } catch (error) {
      console.error("Dönem silme hatası:", error);
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
  
  async getSchedulesByTeacher(teacherId: number): Promise<Schedule[]> {
    return await db.select().from(schedules).where(eq(schedules.teacherId, teacherId));
  }
  
  async getSchedulesByClass(classId: number): Promise<Schedule[]> {
    return await db.select().from(schedules).where(eq(schedules.classId, classId));
  }
  
  async getSchedulesByDay(dayOfWeek: number): Promise<Schedule[]> {
    return await db.select().from(schedules).where(eq(schedules.dayOfWeek, dayOfWeek));
  }
  
  async createSchedule(schedule: InsertSchedule): Promise<Schedule> {
    const result = await db.insert(schedules).values(schedule).returning();
    return result[0];
  }
  
  async updateSchedule(id: number, scheduleData: Partial<InsertSchedule>): Promise<Schedule | undefined> {
    const result = await db
      .update(schedules)
      .set(scheduleData)
      .where(eq(schedules.id, id))
      .returning();
    return result[0];
  }
  
  async deleteSchedule(id: number): Promise<boolean> {
    const result = await db.delete(schedules).where(eq(schedules.id, id));
    return result.count > 0;
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
    const result = await db
      .update(dutyLocations)
      .set(locationData)
      .where(eq(dutyLocations.id, id))
      .returning();
    return result[0];
  }
  
  async deleteDutyLocation(id: number): Promise<boolean> {
    const result = await db.delete(dutyLocations).where(eq(dutyLocations.id, id));
    return result.count > 0;
  }
  
  // Duty Methods
  async getAllDuties(): Promise<Duty[]> {
    return await db.select().from(duties);
  }
  
  async getDutiesByTeacher(teacherId: number): Promise<Duty[]> {
    return await db.select().from(duties).where(eq(duties.teacherId, teacherId));
  }
  
  async getDutiesByDay(dayOfWeek: number): Promise<Duty[]> {
    return await db.select().from(duties).where(eq(duties.dayOfWeek, dayOfWeek));
  }
  
  async createDuty(duty: InsertDuty): Promise<Duty> {
    const result = await db.insert(duties).values(duty).returning();
    return result[0];
  }
  
  async updateDuty(id: number, dutyData: Partial<InsertDuty>): Promise<Duty | undefined> {
    const result = await db
      .update(duties)
      .set(dutyData)
      .where(eq(duties.id, id))
      .returning();
    return result[0];
  }
  
  async deleteDuty(id: number): Promise<boolean> {
    const result = await db.delete(duties).where(eq(duties.id, id));
    return result.count > 0;
  }
  
  // Absence Methods
  async getAllAbsences(): Promise<Absence[]> {
    return await db.select().from(absences);
  }
  
  async getAbsencesByTeacher(teacherId: number): Promise<Absence[]> {
    return await db.select().from(absences).where(eq(absences.teacherId, teacherId));
  }
  
  async getAbsencesByDate(date: Date): Promise<Absence[]> {
    const dateString = date.toISOString().split('T')[0];
    return await db.select().from(absences).where(
      and(
        eq(absences.startDate.toString(), dateString),
        eq(absences.endDate.toString(), dateString)
      )
    );
  }
  
  async createAbsence(absence: InsertAbsence): Promise<Absence> {
    const result = await db.insert(absences).values(absence).returning();
    return result[0];
  }
  
  async updateAbsence(id: number, absenceData: Partial<InsertAbsence>): Promise<Absence | undefined> {
    const result = await db
      .update(absences)
      .set(absenceData)
      .where(eq(absences.id, id))
      .returning();
    return result[0];
  }
  
  async deleteAbsence(id: number): Promise<boolean> {
    const result = await db.delete(absences).where(eq(absences.id, id));
    return result.count > 0;
  }
  
  // Substitution Methods
  async getAllSubstitutions(): Promise<Substitution[]> {
    return await db.select().from(substitutions);
  }
  
  async getSubstitutionsByDate(date: Date): Promise<Substitution[]> {
    const dateString = date.toISOString().split('T')[0];
    return await db.select().from(substitutions).where(eq(substitutions.date.toString(), dateString));
  }
  
  async getSubstitutionsByTeacher(teacherId: number): Promise<Substitution[]> {
    return await db.select().from(substitutions).where(eq(substitutions.teacherId, teacherId));
  }
  
  async getSubstitutionsBySubstituteTeacher(substituteTeacherId: number): Promise<Substitution[]> {
    return await db.select().from(substitutions).where(eq(substitutions.substituteTeacherId, substituteTeacherId));
  }
  
  async createSubstitution(substitution: InsertSubstitution): Promise<Substitution> {
    const result = await db.insert(substitutions).values(substitution).returning();
    return result[0];
  }
  
  async updateSubstitution(id: number, substitutionData: Partial<InsertSubstitution>): Promise<Substitution | undefined> {
    const result = await db
      .update(substitutions)
      .set(substitutionData)
      .where(eq(substitutions.id, id))
      .returning();
    return result[0];
  }
  
  async deleteSubstitution(id: number): Promise<boolean> {
    const result = await db.delete(substitutions).where(eq(substitutions.id, id));
    return result.count > 0;
  }
  
  // Extra Lesson Methods
  async getAllExtraLessons(): Promise<ExtraLesson[]> {
    return await db.select().from(extraLessons);
  }
  
  async getExtraLessonsByTeacher(teacherId: number): Promise<ExtraLesson[]> {
    return await db.select().from(extraLessons).where(eq(extraLessons.teacherId, teacherId));
  }
  
  async getExtraLessonsByMonthYear(month: number, year: number): Promise<ExtraLesson[]> {
    // Filter by month and year using Date object properties
    const lessons = await db.select().from(extraLessons);
    return lessons.filter(lesson => {
      const date = new Date(lesson.date);
      return date.getMonth() + 1 === month && date.getFullYear() === year;
    });
  }
  
  async createExtraLesson(extraLesson: InsertExtraLesson): Promise<ExtraLesson> {
    const result = await db.insert(extraLessons).values(extraLesson).returning();
    return result[0];
  }
  
  async updateExtraLesson(id: number, extraLessonData: Partial<InsertExtraLesson>): Promise<ExtraLesson | undefined> {
    const result = await db
      .update(extraLessons)
      .set(extraLessonData)
      .where(eq(extraLessons.id, id))
      .returning();
    return result[0];
  }
  
  async deleteExtraLesson(id: number): Promise<boolean> {
    const result = await db.delete(extraLessons).where(eq(extraLessons.id, id));
    return result.count > 0;
  }
}

// Export database storage instance
export const storage = new DatabaseStorage();
