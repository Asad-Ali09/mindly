import GoogleClassroomIntegration from "@/components/GoogleClassroomIntegration";

export default function GoogleLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Google Classroom Integration</h1>
        <GoogleClassroomIntegration />
      </div>
    </div>
  );
}