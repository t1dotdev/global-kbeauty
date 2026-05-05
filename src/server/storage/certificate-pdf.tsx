import "server-only";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 56,
    fontFamily: "Helvetica",
    fontSize: 12,
    color: "#111",
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#444",
    marginBottom: 32,
  },
  section: { marginBottom: 18 },
  label: { fontSize: 10, color: "#666", marginBottom: 2 },
  value: { fontSize: 14, fontWeight: 500 },
  divider: {
    borderBottom: 1,
    borderColor: "#ccc",
    marginVertical: 16,
  },
  footer: {
    marginTop: 48,
    fontSize: 10,
    color: "#666",
    textAlign: "center",
  },
});

export type CertificatePdfData = {
  certificateCode: string;
  studentName: string;
  studentCode: string | null;
  courseName: string;
  courseHours: number;
  centerName: string | null;
  centerCode: string | null;
  masterName: string | null;
  masterCode: string | null;
  issuedAt: Date;
  shareUrl: string;
};

function CertificateDoc({ data }: { data: CertificatePdfData }) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Text style={styles.title}>Certificate of Completion</Text>
        <Text style={styles.subtitle}>Global K-Beauty</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Awarded to</Text>
          <Text style={styles.value}>{data.studentName}</Text>
          {data.studentCode ? (
            <Text style={styles.label}>Student code: {data.studentCode}</Text>
          ) : null}
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.label}>Course</Text>
          <Text style={styles.value}>
            {data.courseName} — {data.courseHours} h
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Issued by</Text>
          <Text style={styles.value}>
            {data.centerName ?? "Global K-Beauty"}
            {data.centerCode ? ` (${data.centerCode})` : ""}
          </Text>
          {data.masterName ? (
            <Text style={styles.label}>
              Master: {data.masterName}
              {data.masterCode ? ` (${data.masterCode})` : ""}
            </Text>
          ) : null}
        </View>

        <Text style={styles.footer}>
          Certificate {data.certificateCode} · Issued{" "}
          {data.issuedAt.toLocaleDateString()} · Verify: {data.shareUrl}
        </Text>
      </Page>
    </Document>
  );
}

export async function renderCertificatePdf(data: CertificatePdfData) {
  return renderToBuffer(<CertificateDoc data={data} />);
}
