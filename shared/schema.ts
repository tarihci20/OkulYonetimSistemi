import { pgTable, text, serial, integer, timestamp, boolean, json, time } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Kullanıcılar tablosu
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  fullName: text("full_name"),
  lastLogin: timestamp("last_login"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  isAdmin: true,
});

// Öğretmenler tablosu
export const teachers = pgTable("teachers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  surname: text("surname").notNull(),
  branch: text("branch").notNull(), // Branş (Matematik, Türkçe, vb.)
});

export const insertTeacherSchema = createInsertSchema(teachers);

// Dersler/Branşlar tablosu
export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const insertSubjectSchema = createInsertSchema(subjects);

// Sınıflar tablosu
export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // Örn: "10/A", "9/C"
});

export const insertClassSchema = createInsertSchema(classes);

// Ders saatleri tablosu
export const periods = pgTable("periods", {
  id: serial("id").primaryKey(),
  order: integer("order").notNull(), // 1, 2, 3... (kaçıncı ders)
  startTime: time("start_time").notNull(), // Başlangıç saati (08:30)
  endTime: time("end_time").notNull(), // Bitiş saati (09:10)
});

export const insertPeriodSchema = createInsertSchema(periods);

// Haftalık ders programı tablosu
export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull(),
  classId: integer("class_id").notNull(),
  subjectId: integer("subject_id").notNull(),
  periodId: integer("period_id").notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 1-7 (Pazartesi-Pazar)
});

export const insertScheduleSchema = createInsertSchema(schedules);

// Nöbet yerleri tablosu
export const dutyLocations = pgTable("duty_locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // Örn: "A Blok - 1. Kat", "Kantin"
});

export const insertDutyLocationSchema = createInsertSchema(dutyLocations);

// Nöbet programı tablosu
export const duties = pgTable("duties", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull(),
  locationId: integer("location_id").notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 1-7 (Pazartesi-Pazar)
  periodId: integer("period_id"), // Null ise tüm gün nöbeti
});

export const insertDutySchema = createInsertSchema(duties);

// Öğretmen yoklama tablosu
export const absences = pgTable("absences", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull(),
  reason: text("reason"), // İzin nedeni
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
});

export const insertAbsenceSchema = createInsertSchema(absences);

// Yerine görevlendirme tablosu
export const substitutions = pgTable("substitutions", {
  id: serial("id").primaryKey(),
  absentTeacherId: integer("absent_teacher_id").notNull(),
  substituteTeacherId: integer("substitute_teacher_id").notNull(),
  scheduleId: integer("schedule_id").notNull(),
  date: timestamp("date").notNull(),
});

export const insertSubstitutionSchema = createInsertSchema(substitutions);

// Ek ders tablosu
export const extraLessons = pgTable("extra_lessons", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull(),
  count: integer("count").notNull(), // Ek ders sayısı
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),
  type: text("type").notNull(), // "substitution", "duty", "manual"
  notes: text("notes"),
});

export const insertExtraLessonSchema = createInsertSchema(extraLessons);

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Teacher = typeof teachers.$inferSelect;
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;

export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;

export type Class = typeof classes.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;

export type Period = typeof periods.$inferSelect;
export type InsertPeriod = z.infer<typeof insertPeriodSchema>;

export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;

export type DutyLocation = typeof dutyLocations.$inferSelect;
export type InsertDutyLocation = z.infer<typeof insertDutyLocationSchema>;

export type Duty = typeof duties.$inferSelect;
export type InsertDuty = z.infer<typeof insertDutySchema>;

export type Absence = typeof absences.$inferSelect;
export type InsertAbsence = z.infer<typeof insertAbsenceSchema>;

export type Substitution = typeof substitutions.$inferSelect;
export type InsertSubstitution = z.infer<typeof insertSubstitutionSchema>;

export type ExtraLesson = typeof extraLessons.$inferSelect;
export type InsertExtraLesson = z.infer<typeof insertExtraLessonSchema>;

// Extended schemas with relations for frontend
export const teacherWithDetailsSchema = z.object({
  id: z.number(),
  name: z.string(),
  surname: z.string(),
  branch: z.string(),
  fullName: z.string().optional(),
});

export type TeacherWithDetails = z.infer<typeof teacherWithDetailsSchema>;

export const scheduleWithDetailsSchema = z.object({
  id: z.number(),
  teacher: teacherWithDetailsSchema,
  class: z.object({
    id: z.number(),
    name: z.string(),
  }),
  subject: z.object({
    id: z.number(),
    name: z.string(),
  }),
  period: z.object({
    id: z.number(),
    order: z.number(),
    startTime: z.string(),
    endTime: z.string(),
  }),
  dayOfWeek: z.number(),
});

export type ScheduleWithDetails = z.infer<typeof scheduleWithDetailsSchema>;

export const dutyWithDetailsSchema = z.object({
  id: z.number(),
  teacher: teacherWithDetailsSchema,
  location: z.object({
    id: z.number(),
    name: z.string(),
  }),
  dayOfWeek: z.number(),
  period: z.object({
    id: z.number(),
    order: z.number(),
    startTime: z.string(),
    endTime: z.string(),
  }).optional(),
});

export type DutyWithDetails = z.infer<typeof dutyWithDetailsSchema>;

export const absenceWithDetailsSchema = z.object({
  id: z.number(),
  teacher: teacherWithDetailsSchema,
  reason: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
});

export type AbsenceWithDetails = z.infer<typeof absenceWithDetailsSchema>;

export const substitutionWithDetailsSchema = z.object({
  id: z.number(),
  absentTeacher: teacherWithDetailsSchema,
  substituteTeacher: teacherWithDetailsSchema,
  schedule: scheduleWithDetailsSchema,
  date: z.string(),
});

export type SubstitutionWithDetails = z.infer<typeof substitutionWithDetailsSchema>;

export const extraLessonWithDetailsSchema = z.object({
  id: z.number(),
  teacher: teacherWithDetailsSchema,
  count: z.number(),
  month: z.number(),
  year: z.number(),
  type: z.string(),
  notes: z.string().optional(),
});

export type ExtraLessonWithDetails = z.infer<typeof extraLessonWithDetailsSchema>;
