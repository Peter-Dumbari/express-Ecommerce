import nodemailer from "nodemailer";
import asyncHandler from "express-async-handler";
import { Resend } from "resend";
import fs from "fs";
import path from "path";

// export const sendMail = asyncHandler(
//   async (email, subject, placeholders, htmlFilePath) => {
//     const resend = new Resend(process.env.RESEND_API_KEY);

//     // const transporter = nodemailer.createTransport({
//     //   service: process.env.EMAIL_SERVICE,
//     //   auth: {
//     //     user: process.env.EMAIL,
//     //     pass: process.env.EMAIL_PASSWORD,
//     //   },
//     // });

//     try {
//       const htmlContent = fs.readFileSync(path.resolve(htmlFilePath), "utf8");
//       const emailFile = Object.keys(placeholders).reduce(
//         (content, key) =>
//           content.replace(new RegExp(`{{${key}}}`, "g"), placeholders[key]),
//         htmlContent
//       );

//       // const mailOptions = {
//       //   from: process.env.EMAIL,
//       //   to: email,
//       //   subject: subject,
//       //   html: emailFile,
//       // };

//       resend.emails.send({
//         from: process.env.EMAIL,
//         to: email,
//         subject: subject,
//         html: emailFile,
//       });
//       // transporter.sendMail(mailOptions, (error, info) => {
//       //   if (error) {
//       //     console.log("Error sending email", error);
//       //   } else {
//       //     console.log("Email sent: " + info.response);
//       //   }
//       // });
//       console.log("resend", resend);
//     } catch (error) {
//       console.log("Error sending Email", error);
//       throw new Error(error);
//     }
//   }
// );

export const sendMail = asyncHandler(
  async (email, subject, placeholders, htmlFilePath) => {
    const resend = new Resend(process.env.RESEND_API_KEY);

    console.log("process", process.env.RESEND_API_KEY);

    try {
      const htmlContent = fs.readFileSync(path.resolve(htmlFilePath), "utf8");

      const emailFile = Object.keys(placeholders).reduce(
        (content, key) =>
          content.replace(new RegExp(`{{${key}}}`, "g"), placeholders[key]),
        htmlContent
      );

      const response = await resend.emails.send({
        from: "Tams Store <onboarding@resend.dev>", // IMPORTANT
        to: email,
        subject,
        html: emailFile,
      });

      console.log("Email sent successfully:", response);

      return response; // 👈 THIS is what success looks like
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  }
);
