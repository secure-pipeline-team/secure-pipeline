# Building and Securing a DevSecOps Pipeline for JuiceShop #

This project is completed as part of the Academic Assignment for the Module IE3142 : DevOps Security.
It includes an automated DevSecOps CI/CD pipeline with 4 security gates (SAST/Semgrep, SCA/npm audit, Secrets/Gitleaks, Container/Trivy). 
See `.github/workflows/devsecops.yml` for details.

## Overview ##

This project explores the development of a CI/CD workflow for web apps. Using the intentionally, vulnerable application OWASP Juice-Shop, 
threats were identified and exploited. The code of the vulnerable app was then given fixes based on the level of criticality of impact, tested individually and finally
combined into a complete DevSecOps pipeline.
 
## Team Members ##

1. IT24102109 Dissanayake D.M.K.H
2. IT24100860 Fernando S.K
3. IT24100368 Thaveesha L.H.K
4. IT24101240 Santhilani W.M.K

## References ##

1.	OWASP Foundation, "OWASP Juice Shop," GitHub repository. https://github.com/juice-shop/juice-shop/ 

2.	OWASP Foundation, "OWASP Top 10:2021," OWASP Foundation. https://owasp.org/Top10/ 

3.	Microsoft Corporation, "The STRIDE Threat Model," Microsoft Learn. https://learn.microsoft.com/en-us/previous-versions/commerce-server/ee823878(v=cs.20) 

4.	Docker, Inc., "Docker Documentation." https://docs.docker.com/ 

5.	Semgrep, Inc., "Semgrep Documentation.”. https://semgrep.dev/docs/ 

6.	npm, Inc., "npm audit," npm Docs. https://docs.npmjs.com/cli/v10/commands/npm-audit 

7.	Gitleaks, "Gitleaks: Protect and discover secrets," GitHub repository. https://github.com/gitleaks/gitleaks 

8.	Aqua Security, "Trivy Documentation." https://trivy.dev/docs/

9.	GitHub, "GitHub Actions Documentation." https://docs.github.com/en/actions

10.	GitHub, "About protected branches." https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches

