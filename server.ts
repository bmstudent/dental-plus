import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import jwt from 'jsonwebtoken';

// Import our simulated MongoDB database handlers
import { 
  Doctors, 
  Patients, 
  Appointments, 
  getSlotsForDoctor, 
  bookAppointment, 
  updateAppointmentStatus,
  Patient
} from "./src/backend-db";

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dental_secret_key_change_me_in_prod';

// Helper to authenticate Express requests using Bearer JWT
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: "Access Denied: Missing Telegram Session JWT" });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET) as any;
    req.user = verified;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Session expired or invalid token structure. Please login again." });
  }
}

let detectedAppUrl = process.env.APP_URL || "https://ais-dev-hpb7tt6h5mg3b546a73ui7-561691855981.asia-southeast1.run.app";

async function startServer() {
  const app = express();
  app.use(express.json());

  // Automatically detect the client-side requested origin/host dynamically
  app.use((req, res, next) => {
    const host = req.get('host');
    if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
      detectedAppUrl = `https://${host}`;
    }
    next();
  });

  // --- API ROUTE: Get active doctors ---
  app.get("/api/doctors", (req, res) => {
    res.json({ success: true, doctors: Doctors });
  });

  // --- API ROUTE: Check bot status config ---
  app.get("/api/bot-status", (req, res) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const isConfigured = !!token && token !== "your_telegram_bot_token" && token.trim() !== "";
    res.json({ 
      success: true, 
      configured: isConfigured,
      botTokenSnippet: isConfigured ? `${token.trim().substring(0, 6)}...` : null
    });
  });

  // --- API ROUTE: Fetch slots for doctor ---
  app.get("/api/slots", (req, res) => {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) {
      return res.status(400).json({ error: "doctorId and date (YYYY-MM-DD) query params are required" });
    }

    const slotResult = getSlotsForDoctor(doctorId as string, date as string);
    if (!slotResult) {
      return res.status(404).json({ error: "Physician not found or inactive schedule." });
    }

    res.json({ success: true, ...slotResult });
  });

  // --- API ROUTE: Telegram authentication & Sign-in upsert ---
  app.post("/api/auth/tg", (req, res) => {
    const { initData, mockUser } = req.body;

    // To simulate Telegram Mini App user initiation cleanly:
    // If not in a live TG environment, we authorize the mock user context seamlessly
    let finalUser: any = null;

    if (mockUser) {
      // Find or create Patient
      let patient = Patients.find(p => p.telegramId === mockUser.id.toString());
      if (!patient) {
        patient = {
          id: `pat-${Date.now()}`,
          telegramId: mockUser.id.toString(),
          username: mockUser.username || "tg_user",
          firstName: mockUser.first_name || "Guest",
          lastName: mockUser.last_name || "User",
          phone: mockUser.phone || "",
          email: mockUser.email || "",
          joinedAt: new Date()
        };
        Patients.push(patient);
      } else {
        // Allow updating credentials details dynamically from the frontend simulation settings
        if (mockUser.first_name) patient.firstName = mockUser.first_name;
        if (mockUser.last_name) patient.lastName = mockUser.last_name;
        if (mockUser.phone) patient.phone = mockUser.phone;
        if (mockUser.username) patient.username = mockUser.username;
      }
      finalUser = patient;
    } else {
      // If we got initData query string from active Telegram Mini App, we parse it
      try {
        const params = new URLSearchParams(initData);
        const userStr = params.get('user');
        if (userStr) {
          const rawUser = JSON.parse(userStr);
          let patient = Patients.find(p => p.telegramId === rawUser.id.toString());
          if (!patient) {
            patient = {
              id: `pat-${Date.now()}`,
              telegramId: rawUser.id.toString(),
              username: rawUser.username || "tg_user",
              firstName: rawUser.first_name || "Guest",
              lastName: rawUser.last_name || "User",
              joinedAt: new Date()
            };
            Patients.push(patient);
          }
          finalUser = patient;
        }
      } catch (e) {
        return res.status(400).json({ error: "Failed to decode Telegram initData payload structure." });
      }
    }

    if (!finalUser) {
      return res.status(401).json({ error: "No user context provided for Telegram auth." });
    }

    // Sign JWT
    const payload = {
      telegramId: finalUser.telegramId,
      patientId: finalUser.id,
      firstName: finalUser.firstName,
      username: finalUser.username,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      token,
      patient: finalUser
    });
  });

  // --- API ROUTE: Get currently logged in patient profile (SECURED) ---
  app.get("/api/auth/me", authenticateToken, (req: any, res) => {
    const patientId = req.user.patientId;
    const patient = Patients.find(p => p.id === patientId);
    if (!patient) {
      return res.status(404).json({ error: "Patient clinical record not found." });
    }
    res.json({ success: true, patient });
  });

  // --- API ROUTE: Fetch logged in patient's appointments (SECURED) ---
  app.get("/api/appointments", authenticateToken, (req: any, res) => {
    const patientId = req.user.patientId;
    const userAppointments = Appointments.filter(a => a.patientId === patientId);

    // Populate Doctor info in-memory for frontend
    const populated = userAppointments.map(app => {
      const doctor = Doctors.find(d => d.id === app.doctorId);
      return {
        ...app,
        doctorId: doctor ? {
          id: doctor.id,
          name: doctor.name,
          specialization: doctor.specialization,
          department: doctor.department,
          avatar: doctor.avatar
        } : null
      };
    });

    res.json({ success: true, appointments: populated });
  });

  // --- API ROUTE: Book dental appointment (SECURED with Conflict Check) ---
  app.post("/api/appointments/book", authenticateToken, (req: any, res) => {
    const patientId = req.user.patientId;
    const { doctorId, date, timeSlot, treatmentType, notes } = req.body;

    if (!doctorId || !date || !timeSlot || !treatmentType) {
      return res.status(400).json({ error: "Missing required parameters: doctorId, date, timeSlot, and treatmentType" });
    }

    const bookingResult = bookAppointment({
      doctorId,
      patientId,
      date,
      timeSlot,
      treatmentType,
      notes
    });

    if (bookingResult.error) {
      return res.status(400).json({ error: bookingResult.error });
    }

    // Populate doctor details before response
    const doctor = Doctors.find(d => d.id === doctorId);
    const populated = {
      ...bookingResult.appointment,
      doctorId: doctor ? {
        id: doctor.id,
        name: doctor.name,
        specialization: doctor.specialization,
        department: doctor.department,
        avatar: doctor.avatar
      } : null
    };

    res.json({ success: true, message: "Appointment booked successfully!", appointment: populated });
  });

  // --- API ROUTE: Update appointment status (SECURED cancellation check) ---
  app.patch("/api/appointments/status", authenticateToken, (req: any, res) => {
    const patientId = req.user.patientId;
    const { appointmentId, status } = req.body;

    if (!appointmentId || !status) {
      return res.status(400).json({ error: "appointmentId and status is required" });
    }

    const result = updateAppointmentStatus(appointmentId, patientId, status);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    // Populate
    const doctor = Doctors.find(d => d.id === result.appointment?.doctorId);
    const populated = {
      ...result.appointment,
      doctorId: doctor ? {
        id: doctor.id,
        name: doctor.name,
        specialization: doctor.specialization,
        department: doctor.department,
        avatar: doctor.avatar
      } : null
    };

    res.json({ success: true, message: `Appointment cancelled successfully`, appointment: populated });
  });


  // --- VITE MIDDLEWARE INTERACTION FOR DEV vs PRODUCTION BUILD STATIC SERVING ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    
    // Auto-detect and run Telegram Bot long-polling daemon if bot token is present
    let botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (botToken) {
      botToken = botToken.trim().replace(/^["']|["']$/g, "").trim();
    }
    
    if (botToken && botToken !== "your_telegram_bot_token" && botToken.trim() !== "") {
      console.log("🦷 [Telegram Daemon] Found TELEGRAM_BOT_TOKEN. Starting background daemon...");
      runTelegramBot(botToken).catch(err => {
        console.error("🦷 [Telegram Daemon] Critical background bot error:", err);
      });
    } else {
      console.log("⚠️ [Telegram Daemon] No valid TELEGRAM_BOT_TOKEN set in Secrets. Bot update listeners will remain offline.");
    }
  });
}

interface BotRegState {
  step: 'awaiting_phone' | 'awaiting_firstname' | 'awaiting_lastname';
  phone?: string;
  firstName?: string;
  lastName?: string;
  telegramId: string;
  username?: string;
}

const botRegStates: Record<number, BotRegState> = {};

/**
 * Modern built-in Telegram WebApp Long Polling Daemon with Secure Conversational Registration
 * Exposes commands, parses user inquiries, runs interactive patient profiling, and binds the Mini App frame instantly
 */
async function runTelegramBot(token: string) {
  let offset = 0;
  console.log("🦷 [Telegram Daemon] Active long-polling started with secure registration flow.");

  // Clean the token (handles quotes/spaces from copy-paste)
  const cleanToken = token.trim().replace(/^["']|["']$/g, "").trim();

  // 1. Delete webhook on startup to ensure long polling getUpdates is active
  try {
    const delRes = await fetch(`https://api.telegram.org/bot${cleanToken}/deleteWebhook`);
    const delJSON = await delRes.json() as any;
    console.log("🦷 [Telegram Daemon] Webhook clearance response:", delJSON);
  } catch (err) {
    console.error("🦷 [Telegram Daemon] Webhook clearance failed:", err);
  }

  // Set default Bot commands for user menu
  try {
    await fetch(`https://api.telegram.org/bot${cleanToken}/setMyCommands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commands: [
          { command: "start", description: "🚪 Open Dental Portal / Setup File" },
          { command: "register", description: "👤 Create/Update Patient File" },
          { command: "support", description: "📞 Call Clinic Support Desk" }
        ]
      })
    });
    console.log("🦷 [Telegram Daemon] Menu commands initialized successfully.");
  } catch (err) {
    console.error("🦷 [Telegram Daemon] Could not synchronize bot menu commands:", err);
  }

  while (true) {
    try {
      const getUpdatesUrl = `https://api.telegram.org/bot${cleanToken}/getUpdates?offset=${offset}&timeout=30`;
      const response = await fetch(getUpdatesUrl);
      if (!response.ok) {
        const errText = await response.text();
        console.error(`🦷 [Telegram Daemon] Polling error. Status: ${response.status} ${response.statusText}. Response: ${errText}`);
        // Simple back-off delay upon connection retry
        await new Promise((resolve) => setTimeout(resolve, 8000));
        continue;
      }

      const body = await response.json() as any;
      if (body.ok && body.result && body.result.length > 0) {
        for (const update of body.result) {
          offset = update.update_id + 1;

          if (update.message) {
            const chatId = update.message.chat.id;
            const text = (update.message.text || "").trim();
            const contact = update.message.contact;
            const from = update.message.from || {};
            const tgIdStr = from.id?.toString() || "";

            // 1. Check for global /support override
            if (text.startsWith("/support")) {
              // Delete state if they trigger support
              delete botRegStates[chatId];
              await fetch(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chat_id: chatId,
                  text: `📞 *Maison de Dentiste — Clinical Support*\n\nIf you have questions about your surgery, treatment slots, or require emergency dental consultation, please get in touch with our front desk immediately:\n\n☎️ *+1 (555) 789-1024*\n📧 *reception@maison-dentiste.clinic*\n\nOur doors are open Mondays through Saturdays from 08:30 AM to 06:00 PM.`,
                  parse_mode: "Markdown",
                  reply_markup: { remove_keyboard: true }
                })
              });
              continue;
            }

            // Find current registration state
            const state = botRegStates[chatId];

            // 2. Start/Restart registration via /start, /register
            if (text.startsWith("/start") || text.startsWith("/register")) {
              const existingPatient = Patients.find(p => p.telegramId === tgIdStr);
              
              // If patient is already fully registered and sent /start (not /register), invite them directly
              if (existingPatient && existingPatient.phone && existingPatient.firstName && existingPatient.lastName && !text.startsWith("/register")) {
                const appUrl = detectedAppUrl;
                const userWelcome = `✨ *Welcome back to Maison de Dentiste, ${existingPatient.firstName} ${existingPatient.lastName}!* 🦷\n\nYour clinical profile is fully synchronized and protected:\n📱 *Phone:* \`${existingPatient.phone}\`\n\nTo find dentists, choose slots, and view active bookings, launch your portal below:\n\n💡 _To update your phone or name details, type_ /register _at any time._`;

                await fetch(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    chat_id: chatId,
                    text: userWelcome,
                    parse_mode: "Markdown",
                    reply_markup: {
                      inline_keyboard: [
                        [
                          {
                            text: "🗓️ Launch Patient Portal",
                            web_app: { url: appUrl }
                          }
                        ],
                        [
                          {
                            text: "📞 Contact Practice Helpline",
                            callback_data: "contact_helpline"
                          }
                        ]
                      ]
                    }
                  })
                });
                continue;
              }

              // Otherwise, initialize/restart registration process
              botRegStates[chatId] = {
                step: 'awaiting_phone',
                telegramId: tgIdStr,
                username: from.username || ""
              };

              await fetch(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chat_id: chatId,
                  text: `✨ *Maison de Dentiste Patient Registration* 🦷\n\nTo coordinate your dental session and keep records safe, let's create or update your clinical file.\n\n📱 *Step 1/3:* Please click the button below to **Share My Contact** (recommended), or type your phone number directly below:`,
                  parse_mode: "Markdown",
                  reply_markup: {
                    keyboard: [
                      [
                        {
                          text: "📱 Share My Contact",
                          request_contact: true
                        }
                      ]
                    ],
                    one_time_keyboard: true,
                    resize_keyboard: true
                  }
                })
              });
              continue;
            }

            // 3. Handle active registration turns
            if (state) {
              if (state.step === 'awaiting_phone') {
                let userPhone = "";
                if (contact && contact.phone_number) {
                  userPhone = contact.phone_number;
                } else {
                  userPhone = text;
                }

                if (!userPhone) {
                  await fetch(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      chat_id: chatId,
                      text: `⚠️ *Invalid Phone Input*\n\nPlease tap the **Share My Contact** button or type your telephone number:`,
                      parse_mode: "Markdown"
                    })
                  });
                  continue;
                }

                state.phone = userPhone;
                state.step = 'awaiting_firstname';

                await fetch(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    chat_id: chatId,
                    text: `📱 *Phone Saved:* \`${userPhone}\`\n\n✍️ *Step 2/3:* Please reply with your **First Name** (e.g., Antony):`,
                    parse_mode: "Markdown",
                    reply_markup: { remove_keyboard: true }
                  })
                });
                continue;

              } else if (state.step === 'awaiting_firstname') {
                const nameIn = text;
                if (!nameIn || nameIn.length < 2) {
                  await fetch(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      chat_id: chatId,
                      text: `⚠️ Please enter a valid First Name (minimum 2 letters):`,
                      parse_mode: "Markdown"
                    })
                  });
                  continue;
                }

                state.firstName = nameIn;
                state.step = 'awaiting_lastname';

                await fetch(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    chat_id: chatId,
                    text: `✍️ *First Name Saved:* \`${nameIn}\`\n\n✍️ *Step 3/3:* Now, reply with your **Surname / Last Name** (e.g., Parker, Smith):`,
                    parse_mode: "Markdown"
                  })
                });
                continue;

              } else if (state.step === 'awaiting_lastname') {
                const surnameIn = text;
                if (!surnameIn || surnameIn.length < 2) {
                  await fetch(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      chat_id: chatId,
                      text: `⚠️ Please enter a valid Surname / Last Name (minimum 2 letters):`,
                      parse_mode: "Markdown"
                    })
                  });
                  continue;
                }

                state.lastName = surnameIn;

                // Finalize profiling and register with memory database
                let patient = Patients.find(p => p.telegramId === state.telegramId);
                if (!patient) {
                  patient = {
                    id: `pat-${Date.now()}`,
                    telegramId: state.telegramId,
                    username: state.username || "tg_user",
                    firstName: state.firstName || "Guest",
                    lastName: state.lastName || "User",
                    phone: state.phone || "",
                    joinedAt: new Date()
                  };
                  Patients.push(patient);
                } else {
                  patient.firstName = state.firstName || patient.firstName;
                  patient.lastName = state.lastName || patient.lastName;
                  patient.phone = state.phone || patient.phone;
                  if (state.username) patient.username = state.username;
                }

                // Clear the state machine for this conversation
                delete botRegStates[chatId];

                // Deliver successful welcome and application link!
                const appUrl = detectedAppUrl;
                const userWelcome = `🎉 *Registration Complete! Patient Card Linked.* 🦷\n\nYour dental care files are now securely configured:\n👤 *Name:* ${patient.firstName} ${patient.lastName}\n📱 *Phone:* \`${patient.phone}\`\n\n👇 *Tap below to launch your Client Portal and book treatments directly:*`;

                await fetch(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    chat_id: chatId,
                    text: userWelcome,
                    parse_mode: "Markdown",
                    reply_markup: {
                      inline_keyboard: [
                        [
                          {
                            text: "🗓️ Launch Patient Portal",
                            web_app: { url: appUrl }
                          }
                        ],
                        [
                          {
                            text: "📞 Contact Practice Helpline",
                            callback_data: "contact_helpline"
                          }
                        ]
                      ]
                    }
                  })
                });
                continue;
              }
            }

            // 4. Default: No active state, did not enter a recognizable command
            await fetch(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: chatId,
                text: `✨ *Maison de Dentiste* 🦷\n\nTo schedule appointments, manage reservations, and coordinate your care, please write /start or /register to configure your dental account.`,
                parse_mode: "Markdown"
              })
            });
          } else if (update.callback_query) {
            const cb = update.callback_query;
            const chatId = cb.message?.chat?.id;
            
            // Acknowledge callback immediately to clear spinner
            await fetch(`https://api.telegram.org/bot${cleanToken}/answerCallbackQuery`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ callback_query_id: cb.id })
            }).catch(() => {});

            if (cb.data === "contact_helpline" && chatId) {
              await fetch(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chat_id: chatId,
                  text: `☎️ *Direct Practice Hotline*\n\nPlease feel free to call our reception at:\n*+1 (555) 789-1024*\n\nOur assistants will be happy to help coordinate your treatment schedules.`,
                  parse_mode: "Markdown"
                })
              });
            }
          }
        }
      }
    } catch (err) {
      console.error("🦷 [Telegram Daemon] Error in Poller cycle:", err);
      await new Promise((resolve) => setTimeout(resolve, 8000));
    }
  }
}

startServer();
