import { parse, HTMLElement } from "node-html-parser"
import { readFileSync, writeFileSync } from "fs"
import axios from "axios"

function findSpecialInfoNode(root: HTMLElement, type: string): string | undefined {
    const typeNode = root.querySelector(`dl dt a[title=${type}]`)
    const parentNode = typeNode?.parentNode;
    const targetedNode = parentNode?.nextElementSibling
    const specialInfo = (targetedNode?.firstChild as unknown as HTMLElement)?.getAttribute('title')
    return specialInfo;
}

class SkillsDetails {
    public name!: string | undefined;
    public energyCost!: string | undefined;
    public cooldown!: string | undefined;
    public castingTime!: string | undefined;
    public adrenalineCost!: string | undefined;
    public upkeep!: string | undefined;
    public sacrifice!: string | undefined;
    public overcast!: string | undefined;
    public skill!: string | undefined;
    public attribute!: string | undefined;
    public campaign!: string | undefined;
    public profession!: string | undefined;
    public type!: string | undefined;
}

async function getAllDataFromSkill(skillName: string, url: string): Promise<SkillsDetails> {
    const detailsHtml = (await axios.get(url)).data
    const detailsRoot = parse(detailsHtml)
    findSpecialInfoNode(detailsRoot, "Profession")

    const energyCost = (detailsRoot.querySelector(".skill-stats  ul li a[title=Energy]")?.parentNode)?.rawText
    const cooldown = (detailsRoot.querySelector(".skill-stats  ul li a[title=Recharge]")?.parentNode)?.rawText
    const castingTime = (detailsRoot.querySelector(".skill-stats  ul li a[title=Activation]")?.parentNode)?.rawText
    const adrenalineCost = (detailsRoot.querySelector(".skill-stats  ul li a[title=Adrenaline]")?.parentNode)?.rawText
    const upkeep = (detailsRoot.querySelector(".skill-stats  ul li a[title=Upkeep]")?.parentNode)?.rawText
    const sacrifice = (detailsRoot.querySelector(".skill-stats  ul li a[title=Sacrifice]")?.parentNode)?.rawText
    const overcast = (detailsRoot.querySelector(".skill-stats  ul li a[title=Overcast]")?.parentNode)?.rawText

    const skillImage = detailsRoot.querySelector("div.skill-box  div.skill-image a img")?.getAttribute("src")
    const attribute = findSpecialInfoNode(detailsRoot, ("Attribute"))
    const campaign = findSpecialInfoNode(detailsRoot, ("Campaign"))
    const profession = findSpecialInfoNode(detailsRoot, ("Profession"))
    const type = findSpecialInfoNode(detailsRoot, ('"Skill type"'))

    return {
        name: skillName,
        energyCost,
        cooldown,
        castingTime,
        adrenalineCost,
        upkeep,
        sacrifice,
        overcast,
        skill: skillImage,
        attribute,
        campaign,
        profession,
        type,
    } as SkillsDetails;
}


async function exec() {
    // The html is an edited version of the skills Id Hosted at GWW, with an id inserted in the desired element (start of the table body)
    // see https://wiki.guildwars.com/wiki/Skill_template_format/Skill_list for references
    const gwwSkillsHtml = readFileSync("./gwwHtmlSkills").toString()
    const gwwSkills = parse(gwwSkillsHtml)
    const tableBody = gwwSkills.querySelectorAll("#SkillsTable")[0]

    const tableElements = tableBody.childNodes.filter(child => child.constructor.name === "HTMLElement")

    const skills: { [key: string]: { id: number, detailsPage: string | undefined } } = {}

    for (let i = 1; i < tableElements.length; i++) {
        const currentTableElem = tableElements[i].childNodes.filter(child => child.constructor.name === "HTMLElement")
        const skillsId = currentTableElem[0].childNodes[0].rawText
        const skillsName = currentTableElem[1].childNodes[0].childNodes[0].rawText
        const detailsPage = (currentTableElem[1].childNodes[0] as unknown as HTMLElement).getAttribute('href')

        skills[skillsName] = { id: parseInt(skillsId), detailsPage: detailsPage }
    }

    writeFileSync("./skills.json", JSON.stringify(skills, null, 2))

    const skillsDetails: { [key: string]: SkillsDetails } = JSON.parse(readFileSync("./skills-details.json").toString())//{}

    /*  for (const skillName in skills) {
         try {
             skillsDetails[skillName] = await getAllDataFromSkill(skillName, skills[skillName].detailsPage ?? "");
             console.log(skillName + " OK")
             await new Promise(resolve => setTimeout(resolve, 1000));
         } catch (e) {
             console.log(skillName + "  " + e)
         }
     }
    writeFileSync("./skills-details.json", JSON.stringify(skillsDetails, null, 2))
  */

    const skillsArray = []

    for (const skillName in skillsDetails) {
        const current = skillsDetails[skillName]

        skillsArray.push({
            name: skillName,
            energyCost: current.energyCost !== undefined ? parseInt(current.energyCost) : undefined,
            cooldown: current.cooldown !== undefined ? parseInt(current.cooldown) : undefined,
            castingTime: current.castingTime !== undefined ? parseFloat(current.castingTime.split('&#')[0]) : undefined,
            adrenalineCost: current.adrenalineCost !== undefined ? parseInt(current.adrenalineCost) : undefined,
            upkeep: current.upkeep !== undefined ? parseInt(current.upkeep) : undefined,
            sacrifice: current.sacrifice !== undefined ? parseInt(current.sacrifice.replace('%', '')) : undefined,
            overcast: current.overcast !== undefined ? parseInt(current.overcast) : undefined,
            skill: current.skill,
            attribute: current.attribute,
            campaign: current.campaign,
            profession: current.profession,
            type: current.type,
        } as SkillsDetails)
    }

    writeFileSync("./skills-details-array.json", JSON.stringify(skillsArray, null, 2))
    console.log(skillsArray)
}

exec().catch(e => console.log(e))