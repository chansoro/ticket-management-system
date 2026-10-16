const DOMAIN_TYPOS: Record<string, string> = {
  "gmial.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.con": "gmail.com",
  "gmaill.com": "gmail.com",
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yahoo.co": "yahoo.com",
  "outlok.com": "outlook.com",
  "outllok.com": "outlook.com",
  "hotmial.com": "hotmail.com",
  "hotmal.com": "hotmail.com",
  "iclud.com": "icloud.com",
}

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "yopmail.com",
  "trashmail.com",
  "sharklasers.com",
  "fakeinbox.com",
  "example.com",
  "test.com",
])

export function validateEmailAddress(rawEmail: string): string | null {
  const email = rawEmail.trim().toLowerCase()
  if (!email) {
    return "Please enter your email address."
  }

  // Strict RFC-style email pattern requiring valid local part, domain, and 2+ char TLD
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  if (!emailRegex.test(email)) {
    return "Please enter a valid email address (e.g., name@gmail.com)."
  }

  const [localPart, domain] = email.split("@")
  if (!localPart || !domain || domain.startsWith(".") || domain.endsWith(".") || domain.includes("..")) {
    return "Please enter a valid email address."
  }

  if (DOMAIN_TYPOS[domain]) {
    return `Did you mean ${localPart}@${DOMAIN_TYPOS[domain]}? Please check your email domain spelling.`
  }

  if (DISPOSABLE_DOMAINS.has(domain)) {
    return "Disposable or test email addresses are not allowed. Please use an active personal, work, or school email."
  }

  return null
}
