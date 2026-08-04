import { Badge } from "@/components/ui/badge";
import type { ExtractedCV } from "@/api/types";

export default function ExtractedProfileTab({ profile }: { profile: ExtractedCV }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">{profile.full_name}</h2>
        {profile.headline && <p className="mt-1 text-muted-foreground">{profile.headline}</p>}
        <p className="mt-1 text-sm text-muted-foreground">
          {[profile.email, profile.phone].filter(Boolean).join(" · ") || "No contact info extracted"}
        </p>
        <Badge className="mt-2">{profile.years_of_experience} years of experience</Badge>
      </div>

      {profile.skills.length > 0 && (
        <div>
          <h3 className="mb-3 text-base font-semibold text-foreground">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <Badge key={skill}>{skill}</Badge>
            ))}
          </div>
        </div>
      )}

      {profile.experience.length > 0 && (
        <div>
          <h3 className="mb-3 text-base font-semibold text-foreground">Experience</h3>
          <div className="flex flex-col gap-3">
            {profile.experience.map((exp, i) => (
              <div key={i} className="flex flex-col gap-1 rounded-2xl border border-[#3f3f46] bg-[#27272A] p-4 transition-colors hover:border-[#52525b]">
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[15px] font-semibold text-white">
                    {exp.title} <span className="font-normal text-[#a1a1aa]">at {exp.company}</span>
                  </p>
                  <span className="text-xs text-[#71717a]">
                    {exp.start_date ?? "?"} – {exp.end_date ?? "present"}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-[#a1a1aa]">{exp.summary}</p>
                {exp.achievements.length > 0 && (
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-[#ececec]">
                    {exp.achievements.map((a, j) => (
                      <li key={j}>{a}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {profile.education.length > 0 && (
        <div>
          <h3 className="mb-3 text-base font-semibold text-foreground">Education</h3>
          <div className="flex flex-col gap-3">
            {profile.education.map((edu, i) => (
              <div key={i} className="flex flex-col gap-1 rounded-2xl border border-[#3f3f46] bg-[#27272A] p-4 transition-colors hover:border-[#52525b]">
                  <p className="text-[15px] font-semibold text-white">
                    {edu.degree}
                    {edu.field_of_study && <span className="font-normal text-[#ececec]"> in {edu.field_of_study}</span>}
                  </p>
                  <p className="text-sm text-[#a1a1aa]">
                    {edu.institution}
                    {edu.graduation_year ? ` · ${edu.graduation_year}` : ""}
                  </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {profile.certifications.length > 0 && (
        <div>
          <h3 className="mb-3 text-base font-semibold text-foreground">Certifications</h3>
          <div className="flex flex-wrap gap-2">
            {profile.certifications.map((cert) => (
              <Badge key={cert}>{cert}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
