import { parse } from "node-html-parser"
import { readFileSync, writeFileSync } from "fs"

async function exec() {
    // The html is an edited version of the skills Id Hosted at GWW, with an id inserted in the desired element (start of the table body)
    // see https://wiki.guildwars.com/wiki/Skill_template_format/Skill_list for references
    const gwwSkillsHtml = readFileSync("./gwwHtmlSkills").toString()
    const gwwSkills = parse(gwwSkillsHtml)
    const tableBody = gwwSkills.querySelectorAll("#SkillsTable")[0]

    const tableElements = tableBody.childNodes.filter(child => child.constructor.name === "HTMLElement")

    const skills: any = {}

    for (let i = 1; i < tableElements.length; i++) {
        const currentTableElem = tableElements[i].childNodes.filter(child => child.constructor.name === "HTMLElement")
        const skillsId = currentTableElem[0].childNodes[0].rawText
        const skillsName = currentTableElem[1].childNodes[0].childNodes[0].rawText
        const detailsPage = (currentTableElem[1].childNodes[0] as unknown as HTMLElement).getAttribute('href')

        skills[skillsName] = { id: parseInt(skillsId), detailsPage: detailsPage }
    }

    writeFileSync("./skills.json", JSON.stringify(skills, null, 2))
}

exec().catch(e => console.log(e))