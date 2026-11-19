# Inquiry and résumé retention

Owner: Kamilla Akhmedova, supported by authorized website administrators.

## Policy

Retention is purpose-based, with no fixed deadline. Keep information only while needed to respond to an inquiry and carry out its follow-up. Review records when a matter finishes, when the person asks for deletion, and during routine administration. Record any concrete reason for keeping an unresolved record and review it again when that reason ends.

This is a manual operating process. The website does not automatically delete existing inquiries, résumés, emails, or upload permits. Publishing the notice alone does not perform cleanup.

## Review and deletion

1. Locate the inquiry in Netlify Forms, including its spam inbox. Confirm that it is the intended person's record and that it is no longer needed for the inquiry or follow-up. Handle requests using the contact information already associated with the inquiry; do not ask for identity documents through the public form.
2. Note its `resume-reference`, if present, before deleting the submission. Use the reference to locate only the matching file in the private `private-resumes` store. Do not bulk-delete unrelated files.
3. Delete the associated résumé and any copies downloaded for review when they are no longer needed.
4. Delete the matching form submission and notification email copies held by authorized recipients when no longer needed. A closed inquiry can have copies in both the test recipient's and Kamilla's mailbox.
5. Review `resume-upload-permits` for expired permits. They stop authorizing uploads after 15 minutes but are not automatically removed from storage. Remove expired permit records during cleanup; never remove an active upload permit.
6. Review older, unlinked résumé files left by the previous upload flow. Determine whether they belong to a still-needed inquiry before deleting them.
7. Keep only a minimal internal note that the request or cleanup was completed; do not copy the deleted résumé or the full inquiry into that note.

If a record is still needed for a specific outstanding matter, explain that to the requester and arrange a further review. Never promise that data held independently by a provider has been removed without checking the provider's process.

## Access and handover

- Limit Netlify access and notification recipients to people authorized to handle inquiries.
- Confirm Kamilla's notification email works before removing the developer's test notification.
- Keep résumé downloads out of public folders, Git, and shared preview artifacts.
- Use Netlify's authenticated dashboard for retrieval until a separately authenticated admin area exists.
