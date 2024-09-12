const { Client, GatewayIntentBits, EmbedBuilder, ActivityType, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, Partials, ComponentType  } = require('discord.js');
const fs = require('fs');
const adhkar = require('./adhkar');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel]
});

// إعدادات الأوامر والإدارة
const prefix = ''; //البيرفكس هاذا لكود النقاط حق الالعاب فقط مو الكود كامل
const adminRoles = ['1279129767911620619', '1279129769484750940', '1279144334087684189', '1279129770243653665', '1279129771808133151', '1279247062986129439','', '1279247062986129439', '1279129775897837570']; // هنا الي يقدر يستخدمون اوامر الادارة حق الانذار وا الميوت حط ايدي الرتبه
const muteRoleIds = adminRoles;
const pointsFile = 'points.json';
const warningsFilePath = './warnings.json';
const adhkarChannelId = '1279127358930161671'; // id قناة الأذكار
const welcomeChannelId = '1279126883786821663';// id قناة الترحيب
const autoroleID = '1279129784458412136'; // هنا تحط ايدي الرتبه الي اول ما يخش السيرفر تجيه
const roleIds = ['1279192340258361364']; //id الي يقدر يعطي نقاط في الالعاب  

let pointsData = {};
let warnings = {};
const invites = new Map();

if (fs.existsSync(pointsFile)) {
    pointsData = JSON.parse(fs.readFileSync(pointsFile));
} else {
    fs.writeFileSync(pointsFile, JSON.stringify(pointsData));
}

if (fs.existsSync(warningsFilePath)) {
    warnings = JSON.parse(fs.readFileSync(warningsFilePath, 'utf8'));
}

function parseDuration(duration) {
    const match = duration.match(/(\d+)([dhm])/);
    if (!match) return null;

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
        case 'd': return value * 24 * 60 * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'm': return value * 60 * 1000;
        default: return null;
    }
}

function removeOldWarnings() {
    const currentTime = Date.now();
    let updated = false;

    for (const userId in warnings) {
        if (warnings[userId].length > 0) {
            warnings[userId] = warnings[userId].filter((warning) => {
                return (currentTime - new Date(warning.timestamp).getTime()) < 7 * 24 * 60 * 60 * 1000; // 7 أيام
            });

            if (warnings[userId].length === 0) {
                delete warnings[userId];
            } else {
                updated = true;
            }
        }
    }

    if (updated) {
        fs.writeFileSync(warningsFilePath, JSON.stringify(warnings));
    }
}

setInterval(removeOldWarnings, 7 * 24 * 60 * 60 * 1000); 

client.once('ready', async () => {
    console.log(`Bot is Online! ${client.user.tag}`);
    console.log(`Code by Sanigo`);

    // تعيين حالة الستريمنغ
    client.user.setActivity('Sanigo', { type: ActivityType.Streaming, url: 'https://twitch.tv/yourchannel' });

client.guilds.cache.forEach(async guild => {
    try {
        const firstInvites = await guild.invites.fetch();
        invites.set(guild.id, new Map(firstInvites.map(invite => [invite.code, invite.uses])));
    } catch (error) {
        console.error(`Error fetching invites for guild ${guild.id}:`, error);
    }
});



client.on('messageCreate', async message => {
    if (!message.member) return; 

    const args = message.content.split(' ');
    const command = args.shift().toLowerCase();

    const hasAdminPermission = message.member.roles.cache.some(role => adminRoles.includes(role.id));

    if (command === '-ميوت' && hasAdminPermission) {
        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        const duration = args[1];
        if (!member || !duration) {
            return message.reply('يرجى تحديد المستخدم ومدة الميوت (مثال: 1d 1h 1m).');
        }

        const durationMs = parseDuration(duration);
        if (!durationMs) {
            return message.reply('يرجى تحديد مدة صالحة (مثال: 1d 1h 1m).');
        }

        try {
            await member.timeout(durationMs);
            const embed = new EmbedBuilder()
                .setTitle('🔇 ميوت')
                .setDescription(`${member.user.tag} تم وضعه في ميوت لمدة ${duration}.`)
                .setColor('#ff0000') 
                .setFooter({ text: `بواسطة ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();
            message.channel.send({ embeds: [embed] });
        } catch (error) {
            message.reply('حدث خطأ أثناء محاولة وضع المستخدم في ميوت.');
        }
    }

    if (command === '-فك' && hasAdminPermission) {
        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!member) return message.reply('يرجى تحديد المستخدم لفك الميوت عنه.');

        try {
            await member.timeout(null);
            const embed = new EmbedBuilder()
                .setTitle('🔊 فك الميوت')
                .setDescription(`تم فك الميوت عن ${member.user.tag}.`)
                .setColor('#A9DFBF')
                .setFooter({ text: `بواسطة ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();
            message.channel.send({ embeds: [embed] });
        } catch (error) {
            message.reply('حدث خطأ أثناء محاولة فك الميوت عن المستخدم.');
        }
    }

if (command === '-باند' && hasAdminPermission) {
    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    const duration = args[1];
    if (!member || !duration) {
        return message.reply('يرجى تحديد المستخدم ومدة الحظر (مثال: 1d 1h 1m).');
    }

    const durationMs = parseDuration(duration);
    if (!durationMs) {
        return message.reply('يرجى تحديد مدة صالحة (مثال: 1d 1h 1m).');
    }

    if (member.roles.highest.position >= message.member.roles.highest.position) {
        return message.reply('لا يمكنك حظر شخص بنفس الرتبة أو أعلى منها.');
    }

    try {
        await member.ban({ reason: `حظر لمدة ${duration}` });
        setTimeout(() => {
            message.guild.members.unban(member.id);
        }, durationMs);
        const embed = new EmbedBuilder()
            .setTitle('🚫 باند')
            .setDescription(`${member.user.tag} تم حظره لمدة ${duration}.`)
            .setColor('#ff0000')
            .setFooter({ text: `بواسطة ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();
        message.channel.send({ embeds: [embed] });
    } catch (error) {
        message.reply('حدث خطأ أثناء محاولة حظر المستخدم.');
    }
}

if (command === '-طرد' && hasAdminPermission) {
    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    if (!member) return message.reply('يرجى تحديد المستخدم للطرد.');

    if (member.roles.highest.position >= message.member.roles.highest.position) {
        return message.reply('لا يمكنك طرد شخص بنفس الرتبة أو أعلى منها.');
    }

    try {
        await member.kick();
        const embed = new EmbedBuilder()
            .setTitle('👢 طرد')
            .setDescription(`تم طرد ${member.user.tag}.`)
            .setColor('#ff0000') // لون احمر 
            .setFooter({ text: `بواسطة ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();
        message.channel.send({ embeds: [embed] });
    } catch (error) {
        message.reply('حدث خطأ أثناء محاولة طرد المستخدم.');
    }
}

    // -قفل
    if (command === '-قفل' && hasAdminPermission) {
        try {
            await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
                SendMessages: false
            });

            const embed = new EmbedBuilder()
                .setTitle('🔒 قفل')
                .setDescription(`تم قفل القناة ${message.channel.name}.`)
                .setColor('#ff0000') 
                .setFooter({ text: `بواسطة ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();
            await message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error locking channel:', error.message);
            message.reply(`حدث خطأ أثناء محاولة قفل القناة: ${error.message}`);
        }
    }

    if (command === '-فتح' && hasAdminPermission) {
        try {
            await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
                SendMessages: true 
            });

            const embed = new EmbedBuilder()
                .setTitle('🔓 فتح')
                .setDescription(`تم فتح القناة ${message.channel.name}.`)
                .setColor('#81C784') // لون أخضر 
                .setFooter({ text: `بواسطة ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();
            await message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error unlocking channel:', error.message);
            message.reply(`حدث خطأ أثناء محاولة فتح القناة: ${error.message}`);
    }
}

    if (command === '-ارسال' && hasAdminPermission) {
        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        const messageContent = args.slice(1).join(' ');

        if (!member || !messageContent) {
            return message.reply('يرجى تحديد المستخدم والرسالة للإرسال.');
        }

        try {
            await member.send(messageContent);
            message.reply('تم إرسال الرسالة بنجاح.');
        } catch (error) {
            message.reply('تعذر إرسال الرسالة. ربما تكون رسائل الخاصة مغلقة لهذا المستخدم.');
        }
    }

if (command === '-رول' && hasAdminPermission) {
    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);

    if (!member || !role) {
        return message.reply('يرجى تحديد المستخدم واسم الرتبة.');
    }

    // تحقق من الرتبة
    if (role.position >= message.member.roles.highest.position) {
        return message.reply('لا يمكنك منح رتبة أعلى من رتبتك.');
    }

    try {
        await member.roles.add(role);
        const embed = new EmbedBuilder()
            .setTitle('🏅 إضافة رول')
            .setDescription(`تم إضافة الرتبة ${role.name} للمستخدم ${member.user.tag}.`)
            .setColor('#4DB6AC') 
            .setFooter({ text: `بواسطة ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();
        message.reply({ embeds: [embed] });
    } catch (error) {
        message.reply('حدث خطأ أثناء محاولة إضافة الرتبة للمستخدم.');
    }
}

if (command === '-سحب' && hasAdminPermission) {
    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);

    if (!member || !role) {
        return message.reply('يرجى تحديد المستخدم واسم الرتبة.');
    }

    if (role.position >= message.member.roles.highest.position) {
        return message.reply('لا يمكنك سحب رتبة أعلى من رتبتك.');
    }

    try {
        await member.roles.remove(role);
        const embed = new EmbedBuilder()
            .setTitle('🏅 سحب رول')
            .setDescription(`تم سحب الرتبة ${role.name} من المستخدم ${member.user.tag}.`)
            .setColor('#80CBC4') // لون أخضر مائل للأزرق فاتح
            .setFooter({ text: `بواسطة ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();
        message.reply({ embeds: [embed] });
    } catch (error) {
        message.reply('حدث خطأ أثناء محاولة سحب الرتبة من المستخدم.');
    }
}


    if (command === '-انذار' && hasAdminPermission) {
        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        const reason = args.slice(1).join(' ');

        if (!member || !reason) {
            return message.reply('يرجى تحديد المستخدم وسبب الإنذار.');
        }

        if (!warnings[member.id]) {
            warnings[member.id] = [];
        }

        warnings[member.id].push({ reason: reason, timestamp: new Date().toISOString() });
        fs.writeFileSync(warningsFilePath, JSON.stringify(warnings));

        const warningNumber = warnings[member.id].length;

        const embed = new EmbedBuilder()
            .setTitle('⚠️ إنذار')
            .setDescription(`تم إصدار إنذار للمستخدم ${member.user.tag}.\nالسبب: ${reason}\nالمسؤول: ${message.author.tag}\nرقم الإنذار: ${warningNumber}`)
            .setColor('#FFEB3B') // لون أصفر
            .setFooter({ text: `بواسطة ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();
        message.reply({ embeds: [embed] });

        const privateEmbed = new EmbedBuilder()
            .setTitle('⚠️ إنذار')
            .setDescription(`تم إصدار إنذار لك بسبب: ${reason}\nالمسؤول: ${message.author.tag}\nرقم الإنذار: ${warningNumber}`)
            .setColor('#FFA500') // لون برتقالي
            .setFooter({ text: `من سيرفر ${message.guild.name}`, iconURL: message.guild.iconURL() })
            .setTimestamp()
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
            .setAuthor({ name: message.guild.name, iconURL: message.guild.iconURL() });

        try {
            await member.send({ embeds: [privateEmbed] });
        } catch (error) {
            console.log(`تعذر إرسال رسالة خاصة إلى ${member.user.tag}. ربما تكون الرسائل الخاصة مغلقة.`);
        }
    }

    if (command === '-الانذارات' && hasAdminPermission) {
        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

        if (!member) {
            return message.reply('يرجى تحديد المستخدم.');
        }

        const userWarnings = warnings[member.id] || [];

        if (userWarnings.length === 0) {
            return message.reply(`المستخدم ${member.user.tag} ليس لديه أي إنذارات.`);
        }

        const warningList = userWarnings.map((warning, index) => `**${index + 1}.** ${warning.reason} (تاريخ: ${new Date(warning.timestamp).toLocaleDateString()})`).join('\n');
        const embed = new EmbedBuilder()
            .setTitle(`إنذارات ${member.user.tag}`)
            .setDescription(warningList)
            .setColor('#FFEB3B') // لون أصفر
            .setFooter({ text: `طلب بواسطة ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();
        message.reply({ embeds: [embed] });
    }

    if (command === '-ازالة' && hasAdminPermission) {
        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

        if (!member) {
            return message.reply('يرجى تحديد المستخدم.');
        }

        const userWarnings = warnings[member.id] || [];

        if (userWarnings.length === 0) {
            return message.reply(`المستخدم ${member.user.tag} ليس لديه أي إنذارات.`);
        }

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('remove_all')
                    .setLabel('إزالة جميع الإنذارات')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('remove_last')
                    .setLabel('إزالة آخر إنذار')
                    .setStyle(ButtonStyle.Primary)
            );

        const embed = new EmbedBuilder()
            .setTitle(`إدارة إنذارات ${member.user.tag}`)
            .setDescription('يرجى اختيار الإجراء المطلوب:')
            .setColor('#FFEB3B') // لون أصفر
            .setFooter({ text: `طلب بواسطة ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();

        const response = await message.reply({ embeds: [embed], components: [row] });

        const filter = i => i.user.id === message.author.id;
        const collector = response.createMessageComponentCollector({ filter, componentType: ComponentType.Button, time: 15000 });

        collector.on('collect', async i => {
            if (i.customId === 'remove_all') {
                delete warnings[member.id];
                fs.writeFileSync(warningsFilePath, JSON.stringify(warnings));

                await i.update({ content: `تم إزالة جميع إنذارات ${member.user.tag}.`, embeds: [], components: [] });
            } else if (i.customId === 'remove_last') {
                userWarnings.pop();
                fs.writeFileSync(warningsFilePath, JSON.stringify(warnings));

                await i.update({ content: `تم إزالة آخر إنذار من ${member.user.tag}.`, embeds: [], components: [] });
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                response.edit({ content: 'انتهى الوقت دون اختيار أي إجراء.', embeds: [], components: [] });
            }
        });
    }

    if (command === '-افتار') {
        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;

        const avatarEmbed = new EmbedBuilder()
            .setColor('#050505')
            .setTitle(`أفاتار ${member.user.tag}`)
            .setImage(member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
            .setFooter({ text: `طلب بواسطة ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });
        message.channel.send({ embeds: [avatarEmbed] });
    }

    if (command === '-سيرفر') {
        const { guild } = message;

        const serverEmbed = new EmbedBuilder()
            .setColor('#050505')
            .setTitle(`معلومات السيرفر: ${guild.name}`)
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .addFields(
                { name: 'عدد الأعضاء', value: guild.memberCount.toString(), inline: true },
                { name: 'تاريخ الإنشاء', value: guild.createdAt.toDateString(), inline: true },
                { name: 'المالك', value: `<@${guild.ownerId}>`, inline: true },
                { name: 'المنطقة', value: guild.preferredLocale, inline: true },
                { name: 'عدد الأدوار', value: guild.roles.cache.size.toString(), inline: true },
                { name: 'عدد القنوات النصية', value: guild.channels.cache.filter(channel => channel.type === 0).size.toString(), inline: true },
                { name: 'عدد القنوات الصوتية', value: guild.channels.cache.filter(channel => channel.type === 2).size.toString(), inline: true },
                { name: 'تم التحقق منه', value: guild.verified ? 'نعم' : 'لا', inline: true }
            )
            .setFooter({ text: `طلب بواسطة ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });
        message.channel.send({ embeds: [serverEmbed] });
    }

    if (command === '-بنر') {
        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
        const user = await client.users.fetch(member.id, { force: true });

        const bannerUrl = user.bannerURL({ dynamic: true, size: 1024 });
        if (bannerUrl) {
            const bannerEmbed = new EmbedBuilder()
                .setColor('#050505')
                .setTitle(`بنر ${user.tag}`)
                .setImage(bannerUrl)
                .setFooter({ text: `طلب بواسطة ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });
            message.channel.send({ embeds: [bannerEmbed] });
        } else {
            message.reply('لا يوجد بنر لهذا المستخدم.');
        }
    }

    // -help
    if (command === '-help') {
        const helpEmbed = new EmbedBuilder()
            .setColor('#000000') // لون اسود 
            .setTitle('أوامر البوت')
            .addFields(
                { name: 'أوامر المسؤولين', value: `
                **-ميوت [@المستخدم] [المدة]**: إعطاء المستخدم ميوت لمدة محددة.
                **-فك الميوت [@المستخدم]**: فك الميوت عن المستخدم.
                **-باند [@المستخدم] [المدة]**: حظر المستخدم لمدة محددة.
                **-طرد [@المستخدم]**: طرد المستخدم من السيرفر.
                **-قفل**: قفل القناة.
                **-فتح**: فتح القناة.
                **-ارسال [@المستخدم] [الرسالة]**: إرسال رسالة خاصة للمستخدم.
                **-رول [@المستخدم] [معرف الرتبة]**: إعطاء المستخدم رتبة محددة.
                **-سحب رول [@المستخدم] [معرف الرتبة]**: سحب رتبة محددة من المستخدم.
                **-انذار [@المستخدم] [السبب]**: إعطاء المستخدم إنذار مع السبب.
                **-الانذارات [@المستخدم]**: عرض جميع إنذارات المستخدم.
                **-ازالة [@المستخدم]**: إزالة جميع الإنذارات أو آخر إنذار.
                `, inline: false },
                { name: 'الأوامر العامة', value: `
                **-افتار [@المستخدم]**: عرض أفاتار المستخدم.
                **-سيرفر**: عرض معلومات السيرفر.
                **-بنر [@المستخدم]**: عرض بنر المستخدم.
                `, inline: false }
            )
            .setFooter({ text: 'استخدم الأوامر الإدارية بعناية!', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        message.channel.send({ embeds: [helpEmbed] });
    }
});

client.on('messageCreate', (message) => {
  if (message.author.bot) return;

  if (message.content.toLowerCase() === 'مرحبا') {
    message.channel.send('أهلاً بك!');
  }

if (message.content.toLowerCase() === '.') {
    message.channel.send('**__~~~أحلى من ينقط في الشات | ~~__**');
  }

if (message.content.toLowerCase() === 'السلام عليكم') {
    message.channel.send('**__عليكم السلام ورحمة الله وبركاته__**');
  }

if (message.content.toLowerCase() === 'سلام عليكم') {
    message.channel.send('**__عليكم السلام ورحمة الله وبركاته__**');
  }

  if (message.content.toLowerCase() === 'كيف حالك؟') {
    message.channel.send('أنا بوت، دائمًا في أحسن حال! 😊');
  }
});

client.on('messageCreate', (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith('say')) {
    if (!message.member.permissions.has('Administrator')) {
      return message.channel.send('ليس لديك الصلاحيات اللازمة لاستخدام هذا الأمر.');
    }

    const mentionedChannel = message.mentions.channels.first();
    const textToSend = message.content.split(' ').slice(2).join(' ');

    if (!mentionedChannel) {
      return message.channel.send('يرجى تحديد القناة باستخدام الإشارة (#channel).');
    }

    if (!textToSend) {
      return message.channel.send('يرجى كتابة النص الذي تريد إرساله بعد الإشارة للقناة.');
    }

    mentionedChannel.send(textToSend)
      .then(() => {
        message.channel.send('تم إرسال الرسالة بنجاح!');
      })
      .catch((error) => {
        console.error(error);
        message.channel.send('حدث خطأ أثناء إرسال الرسالة.');
      });
  }
});

    client.on('messageCreate', (message) => {
      if (message.author.bot) return;

      const ROLE_IDS = ['', '1279129771808133151', '1279247062986129439', '1279129775897837570', '1279129770243653665']; // حط ايدي الرتبه هنا

      if (message.content.startsWith('مسح')) {
        // تحقق من أن العضو لديه أي من الرتب المحددة
        const hasRole = ROLE_IDS.some(roleId => message.member.roles.cache.has(roleId));
        if (!hasRole) {
          const noPermissionEmbed = new EmbedBuilder()
            .setColor('#FF0000') // لون أحمر
            .setTitle('⛔ ليس لديك الصلاحيات!')
            .setDescription('⚠️ لا يمكنك استخدام هذا الأمر لأنك لا تملك الرتبة المطلوبة.')
            .setFooter({ text: 'يرجى الاتصال بمسؤول الخادم لمزيد من المعلومات.' });

          return message.reply({ embeds: [noPermissionEmbed] });
        }

        const args = message.content.split(' ');
        const deleteCount = parseInt(args[1], 10);

        if (!deleteCount || deleteCount < 1 || deleteCount > 100) {
          const invalidNumberEmbed = new EmbedBuilder()
            .setColor('#FFA500') // لون برتقالي
            .setTitle('❗ عدد غير صحيح!')
            .setDescription('يرجى تحديد عدد صحيح من الرسائل للحذف (بين 1 و100).')
            .setFooter({ text: 'يرجى المحاولة مرة أخرى.' });

          return message.reply({ embeds: [invalidNumberEmbed] });
        }

        message.channel.bulkDelete(deleteCount + 1)
          .then(deletedMessages => {
            const successEmbed = new EmbedBuilder()
              .setColor('#00FF00') // لون أخضر
              .setTitle('✅ تم الحذف بنجاح!')
              .setDescription(`🗑️ تم حذف ${deletedMessages.size - 1} رسالة بنجاح.`)
              .setFooter({ text: 'شكراً لاستخدامك البوت!' });

            message.channel.send({ embeds: [successEmbed] })
              .then(msg => {
                setTimeout(() => msg.delete(), 5000);  
              });
          })
          .catch(error => {
            console.error(error);
            const errorEmbed = new EmbedBuilder()
              .setColor('#FF0000') // لون أحمر
              .setTitle('❌ خطأ في الحذف!')
              .setDescription('⚠️ حدث خطأ أثناء محاولة حذف الرسائل. تأكد من أن الرسائل ليست أقدم من 14 يومًا.')
              .setFooter({ text: 'يرجى المحاولة لاحقًا.' });

            message.channel.send({ embeds: [errorEmbed] });
          });
      }
    });



client.on('messageCreate', message => {
  if (message.author.bot) return;

  const channelIds = ['1279445229090639872', '1279127985483419732',  '1279127774853992501',  '1279128042307846286',  '1279128872079593514',  '1279127672169041961',  '1279127723532353679', '1279126824634552331']; // استبدل هذه id التي تريدها
  const imageUrl = 'https://imgur.com/a/foFHrup'; // استبدل هذا برابط الصورة الذي تريده

  if (channelIds.includes(message.channel.id)) {
    message.channel.send(imageUrl)
      .then(() => console.log('Image sent successfully'))
      .catch(error => console.error('Error sending message:', error));
  }
});

client.on('messageCreate', (message) => {
  if (message.author.bot) return; // تجاهل الرسائل من البوتات

  const roleId = '1279129770243653665'; // استبدل هذا بمعرف الرتبة الخاصة بك

  if (message.member.roles.cache.has(roleId)) {
    if (message.content.toLowerCase() === '-خط') {
      message.channel.send('https://imgur.com/a/foFHrup')
          //حط رابط الصوره الي  تبغاها
        .then(() => {
          if (message.deletable) {
            message.delete()
              .then(() => console.log('User message deleted successfully'))
              .catch(err => console.error('Error deleting user message:', err));
          } else {
            console.log('Message is not deletable or already deleted.');
          }
        })
        .catch(err => console.error('Error sending bot reply:', err));
    }
  }
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const args = message.content.split(' ');
    const command = args.shift().toLowerCase();

    if (command === '-ping') {
        const sentMessage = await message.channel.send('📶 جارٍ حساب البنق...');
        const ping = sentMessage.createdTimestamp - message.createdTimestamp;

        const embed = new EmbedBuilder()
            .setTitle('🌐 Ping!')
            .setDescription(`**__📶 **البنق:** ${ping}ms\n**WebSocket:** ${client.ws.ping}ms__**`)
            .setColor('#673c9c')
            .setFooter({ text: `بواسطة ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();

        await sentMessage.edit({ content: '', embeds: [embed] });
    }
});

client.on('messageCreate', async (message) => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    let pointsData = JSON.parse(fs.readFileSync(pointsFile));

    if (command === 'نقطه') {
        if (!roleIds.some(roleIds => message.member.roles.cache.has(roleIds))) {
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Error')
                .setDescription('ليس لديك الصلاحيات اللازمة لاستخدام هذا الأمر.')
                .setColor('#E74C3C')
                .setTimestamp();

            return message.reply({ embeds: [errorEmbed] });
        }

        const user = message.mentions.users.first();
        if (!user) return message.reply('منشن الشخص الذي تريد إعطائه نقطة.');

        pointsData[user.id] = (pointsData[user.id] || 0) + 1;

        fs.writeFileSync(pointsFile, JSON.stringify(pointsData));

        const embed = new EmbedBuilder()
            .setTitle('📈 نقطة مضافة!')
            .setDescription(`${user} حصل على نقطة! المجموع الحالي: **${pointsData[user.id]}** نقاط.`)
            .setColor('#000000')
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }

    if (command === 'توب') {
        if (!roleIds.some(roleIds => message.member.roles.cache.has(roleIds))) {
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Error')
                .setDescription('ليس لديك الصلاحيات اللازمة لاستخدام هذا الأمر.')
                .setColor('#E74C3C')
                .setTimestamp();

            return message.reply({ embeds: [errorEmbed] });
        }

        if (Object.keys(pointsData).length === 0) {
            const noDataEmbed = new EmbedBuilder()
                .setTitle('📉 لا توجد نقاط')
                .setDescription('لا توجد نقاط مسجلة لعرضها.')
                .setColor('#E74C3C')
                .setTimestamp();

            return message.channel.send({ embeds: [noDataEmbed] });
        }

        const sortedUsers = Object.keys(pointsData).sort((a, b) => pointsData[b] - pointsData[a]).slice(0, 10);

        const topEmbed = new EmbedBuilder()
            .setTitle('🏆 أعلى الأعضاء نقاطاً')
            .setColor('#000000') 
            .setTimestamp();

        sortedUsers.forEach((userID, index) => {
            topEmbed.addFields({ name: `#${index + 1}`, value: `<@${userID}> - **${pointsData[userID]}** نقاط` });
        });

        message.channel.send({ embeds: [topEmbed] });
    }

    try {
        if (command === 'نقاطي') {
            const userPoints = pointsData[message.author.id] || 0;
            const embed = new EmbedBuilder()
                .setTitle('📈 نقاطك')
                .setDescription(`${message.author} لديك **${userPoints}** نقطة.`)
                .setColor('#000000') 
                .setTimestamp();

            message.channel.send({ embeds: [embed] });
        }

        if (command === 'تزويد') {
            const user = message.mentions.users.first();
            const amount = parseInt(args[1]);
            if (!user || isNaN(amount)) return message.reply('منشن الشخص وحدد عدد النقاط التي تريد إضافتها.');

            pointsData[user.id] = (pointsData[user.id] || 0) + amount;

            fs.writeFileSync(pointsFile, JSON.stringify(pointsData));

            const embed = new EmbedBuilder()
                .setTitle('📈 نقاط مضافة!')
                .setDescription(`${user} حصل على **${amount}** نقاط! المجموع الحالي: **${pointsData[user.id]}** نقاط.`)
                .setColor('#000000')
                .setTimestamp();

            message.channel.send({ embeds: [embed] });
        }

        if (command === 'تنقيص') {
            const user = message.mentions.users.first();
            const amount = parseInt(args[1]);
            if (!user || isNaN(amount)) return message.reply('منشن الشخص وحدد عدد النقاط التي تريد خصمها.');

            pointsData[user.id] = Math.max(0, (pointsData[user.id] || 0) - amount); 

            fs.writeFileSync(pointsFile, JSON.stringify(pointsData));

            const embed = new EmbedBuilder()
                .setTitle('📉 نقاط مخصومة!')
                .setDescription(`${user} تم خصم **${amount}** نقاط! المجموع الحالي: **${pointsData[user.id]}** نقاط.`)
                .setColor('#000000')
                .setTimestamp();

            message.channel.send({ embeds: [embed] });
        }

        if (command === 'تصفير') {
            if (!roleIds.some(roleIds => message.member.roles.cache.has(roleIds))) {
                const errorEmbed = new EmbedBuilder()
                    .setTitle('❌ Error')
                    .setDescription('ليس لديك الصلاحيات اللازمة لاستخدام هذا الأمر.')
                    .setColor('#000000')
                    .setTimestamp();

                return message.reply({ embeds: [errorEmbed] });
            }

            pointsData = {}; 

            fs.writeFileSync(pointsFile, JSON.stringify(pointsData));

            const embed = new EmbedBuilder()
                .setTitle('🔄 تصفير جميع النقاط!')
                .setDescription('تم تصفير نقاط جميع الأعضاء!')
                .setColor(0x000000)
                .setTimestamp();

            message.channel.send({ embeds: [embed] });
        }

        if (command === 'help') {
            const embed = new EmbedBuilder()
                .setColor('#000000')
                .setTitle('🆘 قائمة الأوامر')
                .addFields(
                    { name: `🛠️ أوامر إدارية`, value: `${prefix}نقطه [@المستخدم]: إضافة نقطة للمستخدم (مخصصة لذوي الصلاحيات)\n${prefix}تزويد [@المستخدم] [العدد]: إضافة نقاط للمستخدم\n${prefix}تنقيص [@المستخدم] [العدد]: خصم نقاط من المستخدم\n${prefix}تصفير: تصفير نقاط جميع الأعضاء\n${prefix}توب: عرض أعلى 10 مستخدمين بالنقاط`, inline: false },
                    { name: `📈 أوامر عامة`, value: `${prefix}نقاطي: عرض نقاطك`, inline: false }
                )
                .setFooter({ text: `استخدم الأوامر بحذر!` })
                .setTimestamp();

            message.channel.send({ embeds: [embed] });
        }
    } catch (error) {
        console.error(error);
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Error')
            .setDescription('حدث خطأ أثناء تنفيذ الأمر.')
            .setColor('#E74C3C') 
            .setTimestamp();

        message.channel.send({ embeds: [errorEmbed] });
    }
});

setInterval(() => {
    const adhkarChannel = client.channels.cache.get(adhkarChannelId);
    if (!adhkarChannel) {
        console.log('Adhkar channel not found');
        return;
    }

    const randomAdhkar = adhkar[Math.floor(Math.random() * adhkar.length)]; 
    const adhkarEmbed = new EmbedBuilder()
        .setColor('#05131f')
        .setTitle('ذكر')
        .setDescription(randomAdhkar);

    adhkarChannel.send({ embeds: [adhkarEmbed] });
}, 3 * 60 * 60 * 1000); // 3 ساعات
});

client.on('guildMemberAdd', async member => {
    console.log('A new member has joined:', member.user.username);

    try {
        const newInvites = await member.guild.invites.fetch();
        const oldInvites = invites.get(member.guild.id);

        const invite = newInvites.find(inv => inv.uses > (oldInvites.get(inv.code) || 0));
        const inviter = invite ? invite.inviter : null;

        invites.set(member.guild.id, new Map(newInvites.map(inv => [inv.code, inv.uses])));

        const channel = member.guild.channels.cache.get(welcomeChannelId);
        if (!channel) {
            console.log('Welcome channel not found');
            return;
        }

        const role = member.guild.roles.cache.get(autoroleID);
        if (role) {
            await member.roles.add(role);
            console.log(`Assigned role ${role.name} to ${member.user.username}`);
        } else {
            console.log('Role not found');
        }

        const inviterMention = inviter ? `<@${inviter.id}>` : 'Unknown';

const welcomeEmbed = new EmbedBuilder()
    .setColor('#000000')
    .setTitle('مرحبًا بك في السيرفر!')
    .setDescription(`مرحبًا ${member}, مرحبًا بك في السيرفر استمتع بإقامتك.`)
    .addFields(
        { name: 'اسم المستخدم', value: member.user.username, inline: true },
        { name: 'تمت الدعوة بواسطة', value: inviterMention, inline: true },
        { name: 'أنت عضو رقم', value: member.guild.memberCount.toString(), inline: true },
        { name: 'قوانين السيرفر', value: '<#1279126643499204651>', inline: true },
        { name: 'قناة الدعم', value: '<#1279127618914095144>', inline: true }
    )
    .setImage('https://images-ext-1.discordapp.net/external/Fs2VPJBW7ucBJGH0pbhoy37NHU4e8SN1D86ZOHWu3HA/https/i.imgur.com/D8xKOSf.mp4') // حط رابط مباشر للصورة هنا
    .setTimestamp();

channel.send({ embeds: [welcomeEmbed] });
    } catch (error) {
        console.error('Error fetching invites or assigning role:', error);
    }
});


client.on('messageCreate', message => {
    if (message.content.startsWith('-say')) {
        if (message.author.bot) return;

        const member = message.guild.members.cache.get(message.author.id);
        if (!member || (!member.permissions.has('ADMINISTRATOR') && !member.permissions.has('MANAGE_GUILD'))) {
            return message.reply('ليس لديك الصلاحية لاستخدام هذا الأمر.');
        }

        const text = message.content.slice(5).trim();

        if (!text) {
            return message.reply(' اكتب الكلام بعد الأمر ');
        }

        const embed = new EmbedBuilder()
            .setDescription(text)
            .setColor('#000000'); 

        message.channel.send({ embeds: [embed] });
    }
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return; 
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    if (urlRegex.test(message.content)) {
        // تحقق إذا كان المرسل لديه صلاحية ADMINISTRATOR
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            // حذف الرسالة
            await message.delete();
            await message.channel.send(`**__${message.author},  يمنع نشر الروابط هنا__**🚫`);
        }
    }
});

client.login('');
