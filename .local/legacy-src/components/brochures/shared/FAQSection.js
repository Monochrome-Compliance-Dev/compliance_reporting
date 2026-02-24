import { Typography, Box, Paper } from "@mui/material";

const FAQSection = ({ faqs, title = "Frequently Asked Questions" }) => {
  return (
    <>
      <Typography variant="h6" sx={{ mt: 6 }} gutterBottom>
        {title}
      </Typography>
      {faqs.map((faq, idx) => (
        <Paper key={idx} sx={{ p: 3, mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            {faq.question}
          </Typography>
          <Typography variant="body2">{faq.answer}</Typography>
        </Paper>
      ))}
    </>
  );
};

export default FAQSection;
