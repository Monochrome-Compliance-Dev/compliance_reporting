import { fetchWrapper } from "../../lib/utils/";

const baseUrl = `${process.env.REACT_APP_API_URL}/public`;

export const publicService = {
  sendEmail,
  sendSesEmail,
  sendAttachmentEmail,
};

async function sendEmail(formData) {
  return await fetchWrapper.post(`${baseUrl}/send-email`, formData);
}

async function sendSesEmail(formData) {
  try {
    const response = await fetchWrapper.post(
      `${baseUrl}/send-ses-email`,
      formData
    );
    return response;
  } catch (error) {
    console.error("Failed to send SES email:", error);
    throw error;
  }
}

async function sendAttachmentEmail(formData, isFormData = false) {
  try {
    const response = await fetchWrapper.postEmail(
      `${baseUrl}/send-attachment-email`,
      formData
    );
    return response;
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
}
