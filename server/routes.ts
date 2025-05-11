import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertTeacherSchema, insertSubjectSchema, insertClassSchema, insertPeriodSchema, insertScheduleSchema, insertDutyLocationSchema, insertDutySchema, insertAbsenceSchema, insertSubstitutionSchema, insertExtraLessonSchema } from "@shared/schema";
import { z } from "zod";

// Middleware to check if user is authenticated
const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Oturum açmanız gerekiyor" });
};

// Middleware to check if user is admin
const isAdmin = (req: any, res: any, next: any) => {
  if (req.isAuthenticated() && req.user.isAdmin) {
    return next();
  }
  res.status(403).json({ message: "Yönetici yetkisi gerekiyor" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  
  // Teacher routes
  app.get("/api/teachers", isAuthenticated, async (req, res) => {
    try {
      const teachers = await storage.getAllTeachers();
      res.json(teachers);
    } catch (error) {
      res.status(500).json({ message: "Öğretmenler alınırken hata oluştu" });
    }
  });
  
  app.get("/api/teachers/:id", isAuthenticated, async (req, res) => {
    try {
      const teacher = await storage.getTeacher(parseInt(req.params.id));
      if (!teacher) {
        return res.status(404).json({ message: "Öğretmen bulunamadı" });
      }
      res.json(teacher);
    } catch (error) {
      res.status(500).json({ message: "Öğretmen alınırken hata oluştu" });
    }
  });
  
  app.post("/api/teachers", isAdmin, async (req, res) => {
    try {
      const validatedData = insertTeacherSchema.parse(req.body);
      const teacher = await storage.createTeacher(validatedData);
      res.status(201).json(teacher);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Geçersiz veri", errors: error.errors });
      }
      res.status(500).json({ message: "Öğretmen eklenirken hata oluştu" });
    }
  });
  
  app.put("/api/teachers/:id", isAdmin, async (req, res) => {
    try {
      const validatedData = insertTeacherSchema.partial().parse(req.body);
      const teacher = await storage.updateTeacher(parseInt(req.params.id), validatedData);
      if (!teacher) {
        return res.status(404).json({ message: "Öğretmen bulunamadı" });
      }
      res.json(teacher);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Geçersiz veri", errors: error.errors });
      }
      res.status(500).json({ message: "Öğretmen güncellenirken hata oluştu" });
    }
  });
  
  app.delete("/api/teachers/:id", isAdmin, async (req, res) => {
    try {
      const result = await storage.deleteTeacher(parseInt(req.params.id));
      if (!result) {
        return res.status(404).json({ message: "Öğretmen bulunamadı" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Öğretmen silinirken hata oluştu" });
    }
  });
  
  // Subject routes
  app.get("/api/subjects", isAuthenticated, async (req, res) => {
    try {
      const subjects = await storage.getAllSubjects();
      res.json(subjects);
    } catch (error) {
      res.status(500).json({ message: "Dersler alınırken hata oluştu" });
    }
  });
  
  app.post("/api/subjects", isAdmin, async (req, res) => {
    try {
      const validatedData = insertSubjectSchema.parse(req.body);
      const subject = await storage.createSubject(validatedData);
      res.status(201).json(subject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Geçersiz veri", errors: error.errors });
      }
      res.status(500).json({ message: "Ders eklenirken hata oluştu" });
    }
  });
  
  // Class routes
  app.get("/api/classes", isAuthenticated, async (req, res) => {
    try {
      const classes = await storage.getAllClasses();
      res.json(classes);
    } catch (error) {
      res.status(500).json({ message: "Sınıflar alınırken hata oluştu" });
    }
  });
  
  app.post("/api/classes", isAdmin, async (req, res) => {
    try {
      const validatedData = insertClassSchema.parse(req.body);
      const classObj = await storage.createClass(validatedData);
      res.status(201).json(classObj);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Geçersiz veri", errors: error.errors });
      }
      res.status(500).json({ message: "Sınıf eklenirken hata oluştu" });
    }
  });
  
  // Period routes
  app.get("/api/periods", isAuthenticated, async (req, res) => {
    try {
      const periods = await storage.getAllPeriods();
      res.json(periods);
    } catch (error) {
      res.status(500).json({ message: "Ders saatleri alınırken hata oluştu" });
    }
  });
  
  app.post("/api/periods", isAdmin, async (req, res) => {
    try {
      const validatedData = insertPeriodSchema.parse(req.body);
      const period = await storage.createPeriod(validatedData);
      res.status(201).json(period);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Geçersiz veri", errors: error.errors });
      }
      res.status(500).json({ message: "Ders saati eklenirken hata oluştu" });
    }
  });
  
  // Schedule routes
  app.get("/api/schedules", isAuthenticated, async (req, res) => {
    try {
      const schedules = await storage.getAllSchedules();
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ message: "Ders programları alınırken hata oluştu" });
    }
  });
  
  app.get("/api/schedules/teacher/:teacherId", isAuthenticated, async (req, res) => {
    try {
      const schedules = await storage.getSchedulesByTeacher(parseInt(req.params.teacherId));
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ message: "Öğretmen ders programı alınırken hata oluştu" });
    }
  });
  
  app.get("/api/schedules/class/:classId", isAuthenticated, async (req, res) => {
    try {
      const schedules = await storage.getSchedulesByClass(parseInt(req.params.classId));
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ message: "Sınıf ders programı alınırken hata oluştu" });
    }
  });
  
  app.get("/api/schedules/day/:day", isAuthenticated, async (req, res) => {
    try {
      const schedules = await storage.getSchedulesByDay(parseInt(req.params.day));
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ message: "Gün ders programı alınırken hata oluştu" });
    }
  });
  
  app.post("/api/schedules", isAdmin, async (req, res) => {
    try {
      const validatedData = insertScheduleSchema.parse(req.body);
      const schedule = await storage.createSchedule(validatedData);
      res.status(201).json(schedule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Geçersiz veri", errors: error.errors });
      }
      res.status(500).json({ message: "Ders programı eklenirken hata oluştu" });
    }
  });
  
  // Duty location routes
  app.get("/api/duty-locations", isAuthenticated, async (req, res) => {
    try {
      const locations = await storage.getAllDutyLocations();
      res.json(locations);
    } catch (error) {
      res.status(500).json({ message: "Nöbet yerleri alınırken hata oluştu" });
    }
  });
  
  app.post("/api/duty-locations", isAdmin, async (req, res) => {
    try {
      const validatedData = insertDutyLocationSchema.parse(req.body);
      const location = await storage.createDutyLocation(validatedData);
      res.status(201).json(location);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Geçersiz veri", errors: error.errors });
      }
      res.status(500).json({ message: "Nöbet yeri eklenirken hata oluştu" });
    }
  });
  
  // Duty routes
  app.get("/api/duties", isAuthenticated, async (req, res) => {
    try {
      const duties = await storage.getAllDuties();
      res.json(duties);
    } catch (error) {
      res.status(500).json({ message: "Nöbetler alınırken hata oluştu" });
    }
  });
  
  app.get("/api/duties/teacher/:teacherId", isAuthenticated, async (req, res) => {
    try {
      const duties = await storage.getDutiesByTeacher(parseInt(req.params.teacherId));
      res.json(duties);
    } catch (error) {
      res.status(500).json({ message: "Öğretmen nöbetleri alınırken hata oluştu" });
    }
  });
  
  app.get("/api/duties/day/:day", isAuthenticated, async (req, res) => {
    try {
      const duties = await storage.getDutiesByDay(parseInt(req.params.day));
      res.json(duties);
    } catch (error) {
      res.status(500).json({ message: "Gün nöbetleri alınırken hata oluştu" });
    }
  });
  
  app.post("/api/duties", isAdmin, async (req, res) => {
    try {
      const validatedData = insertDutySchema.parse(req.body);
      const duty = await storage.createDuty(validatedData);
      res.status(201).json(duty);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Geçersiz veri", errors: error.errors });
      }
      res.status(500).json({ message: "Nöbet eklenirken hata oluştu" });
    }
  });
  
  // Absence routes
  app.get("/api/absences", isAuthenticated, async (req, res) => {
    try {
      const absences = await storage.getAllAbsences();
      res.json(absences);
    } catch (error) {
      res.status(500).json({ message: "İzinler alınırken hata oluştu" });
    }
  });
  
  app.get("/api/absences/teacher/:teacherId", isAuthenticated, async (req, res) => {
    try {
      const absences = await storage.getAbsencesByTeacher(parseInt(req.params.teacherId));
      res.json(absences);
    } catch (error) {
      res.status(500).json({ message: "Öğretmen izinleri alınırken hata oluştu" });
    }
  });
  
  app.get("/api/absences/date/:date", isAuthenticated, async (req, res) => {
    try {
      const date = new Date(req.params.date);
      if (isNaN(date.getTime())) {
        return res.status(400).json({ message: "Geçersiz tarih formatı" });
      }
      
      const absences = await storage.getAbsencesByDate(date);
      res.json(absences);
    } catch (error) {
      res.status(500).json({ message: "Tarih izinleri alınırken hata oluştu" });
    }
  });
  
  app.post("/api/absences", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertAbsenceSchema.parse(req.body);
      const absence = await storage.createAbsence(validatedData);
      res.status(201).json(absence);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Geçersiz veri", errors: error.errors });
      }
      res.status(500).json({ message: "İzin eklenirken hata oluştu" });
    }
  });
  
  // Substitution routes
  app.get("/api/substitutions", isAuthenticated, async (req, res) => {
    try {
      const substitutions = await storage.getAllSubstitutions();
      res.json(substitutions);
    } catch (error) {
      res.status(500).json({ message: "Yerine görevlendirmeler alınırken hata oluştu" });
    }
  });
  
  app.get("/api/substitutions/date/:date", isAuthenticated, async (req, res) => {
    try {
      const date = new Date(req.params.date);
      if (isNaN(date.getTime())) {
        return res.status(400).json({ message: "Geçersiz tarih formatı" });
      }
      
      const substitutions = await storage.getSubstitutionsByDate(date);
      res.json(substitutions);
    } catch (error) {
      res.status(500).json({ message: "Tarih yerine görevlendirmeleri alınırken hata oluştu" });
    }
  });
  
  app.post("/api/substitutions", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertSubstitutionSchema.parse(req.body);
      const substitution = await storage.createSubstitution(validatedData);
      res.status(201).json(substitution);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Geçersiz veri", errors: error.errors });
      }
      res.status(500).json({ message: "Yerine görevlendirme eklenirken hata oluştu" });
    }
  });
  
  // Extra lesson routes
  app.get("/api/extra-lessons", isAuthenticated, async (req, res) => {
    try {
      const extraLessons = await storage.getAllExtraLessons();
      res.json(extraLessons);
    } catch (error) {
      res.status(500).json({ message: "Ek dersler alınırken hata oluştu" });
    }
  });
  
  app.get("/api/extra-lessons/teacher/:teacherId", isAuthenticated, async (req, res) => {
    try {
      const extraLessons = await storage.getExtraLessonsByTeacher(parseInt(req.params.teacherId));
      res.json(extraLessons);
    } catch (error) {
      res.status(500).json({ message: "Öğretmen ek dersleri alınırken hata oluştu" });
    }
  });
  
  app.get("/api/extra-lessons/month/:month/year/:year", isAuthenticated, async (req, res) => {
    try {
      const month = parseInt(req.params.month);
      const year = parseInt(req.params.year);
      
      if (isNaN(month) || month < 1 || month > 12 || isNaN(year)) {
        return res.status(400).json({ message: "Geçersiz ay veya yıl" });
      }
      
      const extraLessons = await storage.getExtraLessonsByMonthYear(month, year);
      res.json(extraLessons);
    } catch (error) {
      res.status(500).json({ message: "Ay/yıl ek dersleri alınırken hata oluştu" });
    }
  });
  
  app.post("/api/extra-lessons", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertExtraLessonSchema.parse(req.body);
      const extraLesson = await storage.createExtraLesson(validatedData);
      res.status(201).json(extraLesson);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Geçersiz veri", errors: error.errors });
      }
      res.status(500).json({ message: "Ek ders eklenirken hata oluştu" });
    }
  });
  
  // Combined data endpoints for the frontend
  app.get("/api/dashboard/current-day", isAuthenticated, async (req, res) => {
    try {
      const now = new Date();
      const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay(); // Convert Sunday (0) to 7 for our system
      
      // Get today's schedules
      const schedules = await storage.getSchedulesByDay(dayOfWeek);
      
      // Get today's duties
      const duties = await storage.getDutiesByDay(dayOfWeek);
      
      // Get today's absences
      const absences = await storage.getAbsencesByDate(now);
      
      // Get today's substitutions
      const substitutions = await storage.getSubstitutionsByDate(now);
      
      // Get all periods for reference
      const periods = await storage.getAllPeriods();
      
      // Calculate current period based on time
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      
      let currentPeriod = null;
      for (const period of periods) {
        if (currentTimeString >= period.startTime && currentTimeString <= period.endTime) {
          currentPeriod = period;
          break;
        }
      }
      
      // Return the combined data
      res.json({
        date: now.toISOString(),
        dayOfWeek,
        schedules,
        duties,
        absences,
        substitutions,
        periods,
        currentPeriod
      });
    } catch (error) {
      res.status(500).json({ message: "Günlük veri alınırken hata oluştu" });
    }
  });

  // Enhanced data routes that join related data
  app.get("/api/enhanced/schedules", isAuthenticated, async (req, res) => {
    try {
      const schedules = await storage.getAllSchedules();
      const teachers = await storage.getAllTeachers();
      const classes = await storage.getAllClasses();
      const subjects = await storage.getAllSubjects();
      const periods = await storage.getAllPeriods();
      
      const enhancedSchedules = schedules.map(schedule => {
        const teacher = teachers.find(t => t.id === schedule.teacherId);
        const classObj = classes.find(c => c.id === schedule.classId);
        const subject = subjects.find(s => s.id === schedule.subjectId);
        const period = periods.find(p => p.id === schedule.periodId);
        
        return {
          id: schedule.id,
          teacher: {
            id: teacher?.id,
            name: teacher?.name,
            surname: teacher?.surname,
            branch: teacher?.branch,
            fullName: teacher ? `${teacher.name} ${teacher.surname}` : 'Bilinmeyen Öğretmen'
          },
          class: {
            id: classObj?.id,
            name: classObj?.name || 'Bilinmeyen Sınıf'
          },
          subject: {
            id: subject?.id,
            name: subject?.name || 'Bilinmeyen Ders'
          },
          period: {
            id: period?.id,
            order: period?.order,
            startTime: period?.startTime,
            endTime: period?.endTime
          },
          dayOfWeek: schedule.dayOfWeek
        };
      });
      
      res.json(enhancedSchedules);
    } catch (error) {
      res.status(500).json({ message: "Gelişmiş ders programı verileri alınırken hata oluştu" });
    }
  });
  
  app.get("/api/enhanced/duties", isAuthenticated, async (req, res) => {
    try {
      const duties = await storage.getAllDuties();
      const teachers = await storage.getAllTeachers();
      const locations = await storage.getAllDutyLocations();
      const periods = await storage.getAllPeriods();
      
      const enhancedDuties = duties.map(duty => {
        const teacher = teachers.find(t => t.id === duty.teacherId);
        const location = locations.find(l => l.id === duty.locationId);
        const period = duty.periodId ? periods.find(p => p.id === duty.periodId) : null;
        
        return {
          id: duty.id,
          teacher: {
            id: teacher?.id,
            name: teacher?.name,
            surname: teacher?.surname,
            branch: teacher?.branch,
            fullName: teacher ? `${teacher.name} ${teacher.surname}` : 'Bilinmeyen Öğretmen'
          },
          location: {
            id: location?.id,
            name: location?.name || 'Bilinmeyen Konum'
          },
          dayOfWeek: duty.dayOfWeek,
          period: period ? {
            id: period.id,
            order: period.order,
            startTime: period.startTime,
            endTime: period.endTime
          } : null
        };
      });
      
      res.json(enhancedDuties);
    } catch (error) {
      res.status(500).json({ message: "Gelişmiş nöbet verileri alınırken hata oluştu" });
    }
  });
  
  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
