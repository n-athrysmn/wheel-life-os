import type { QuestConfiguration } from "../helpers/quest-definition";
import { Badge } from "./ui";

function componentValue(
  component: QuestConfiguration["components"][number],
  config: QuestConfiguration,
) {
  if (component === "Notes") return config.notes;
  if (component === "Pros and cons")
    return `Pros: ${config.pros || "—"}\nCons: ${config.cons || "—"}`;
  if (component === "Moral values") return config.moralValues;
  if (component === "Lesson learned") return config.lessonLearned;
  if (component === "Lore") return config.lore;
  if (component === "Scraps")
    return config.scraps?.length
      ? `${config.scraps.length} image${config.scraps.length === 1 ? "" : "s"}`
      : "";
  return "";
}

export function QuestSummary({
  configuration: config,
}: {
  configuration: QuestConfiguration;
}) {
  return (
    <div className='mt-3 space-y-3'>
      <div className='flex flex-wrap gap-1'>
        {config.tags.map((tag) => (
          <Badge
            key={tag}
            className='rounded-full bg-wheel-parchment px-2 py-0.5 text-[10px] capitalize text-wheel-slate'
          >
            {tag}
          </Badge>
        ))}
      </div>
      <details className='text-base text-wheel-slate'>
        <summary className='cursor-pointer'>
          Quest components ({config.components.length})
        </summary>
        <div className='mt-3 space-y-3'>
          {config.components.map((component) => (
            <div key={component}>
              <h4 className='font-semibold text-wheel-ink'>{component}</h4>
              {component === "Side quest" ? (
                config.subQuests.length ? (
                  <ul className='mt-1 list-disc pl-4'>
                    {config.subQuests.map((item) => (
                      <li key={item.id} className='mb-3'>
                        <span className='font-medium text-wheel-ink'>
                          {item.title}
                        </span>
                        <span className='block'>
                          {item.points} {item.points === 1 ? "point" : "points"}{" "}
                          • {item.done ? "Completed" : "Not completed"}
                        </span>
                        {item.note && (
                          <p className='whitespace-pre-wrap'>{item.note}</p>
                        )}
                        {item.dueDate && (
                          <p>
                            Due{" "}
                            <time dateTime={item.dueDate}>{item.dueDate}</time>
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No side quests yet.</p>
                )
              ) : (
                <p className='mt-1 whitespace-pre-wrap'>
                  {componentValue(component, config) || "No details yet."}
                </p>
              )}
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
