import nodemailer from "nodemailer";
import asyncHandler from "express-async-handler";
import fs from "fs";
import path from "path";

export const sendMail = asyncHandler(
  async (email, subject, placeholders, htmlFilePath) => {
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    console.log("htmlFIlePath", htmlFilePath);
    try {
      const htmlContent = fs.readFileSync(path.resolve(htmlFilePath), "utf8");
      const emailFile = Object.keys(placeholders).reduce(
        (content, key) =>
          content.replace(new RegExp(`{{${key}}}`, "g"), placeholders[key]),
        htmlContent
      );

      const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: subject,
        html: emailFile,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log("Error sending email", error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });
    } catch (error) {
      console.log("Error sending Email", error);
      throw new Error(error);
    }
  }
);
